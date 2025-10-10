import { DefaultAzureCredential } from '@azure/identity'

/**
 * Get Azure credential for authentication
 * Uses DefaultAzureCredential which tries multiple auth methods:
 * 1. Azure CLI (local development)
 * 2. Managed Identity (production)
 * 3. Environment variables
 * 4. Azure PowerShell
 */
export function getAzureCredential() {
  return new DefaultAzureCredential()
}

/**
 * Get subscription ID from environment variable
 * Falls back to first available subscription
 */
export function getSubscriptionId(): string | undefined {
  return process.env.AZURE_SUBSCRIPTION_ID
}
