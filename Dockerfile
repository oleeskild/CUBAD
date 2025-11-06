# Use Node.js 25 Alpine as base image
FROM node:25-alpine AS base

# Install Azure CLI and dependencies for authentication
RUN apk add --no-cache \
    libc6-compat \
    bash \
    curl \
    jq \
    py3-pip \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    python3-dev

# Install Azure CLI in a virtual environment
RUN python3 -m venv /opt/azvenv \
    && /opt/azvenv/bin/pip install --no-cache-dir azure-cli

# Create symlink for az command
RUN ln -sf /opt/azvenv/bin/az /usr/local/bin/az

# Create nextjs user and group
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Create Azure CLI directory for mounting
RUN mkdir -p /home/nextjs/.azure \
    && chown -R nextjs:nodejs /home/nextjs/.azure

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 9090

ENV PORT 9090
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
