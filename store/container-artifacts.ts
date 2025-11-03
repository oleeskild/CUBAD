import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ArtifactDefinition } from '@/types/ai'
import {
  getContainerArtifact,
  saveContainerArtifact,
  deleteContainerArtifact,
  getArtifactsForContainer,
  getArtifactsGroupedByName,
  getArtifactVersions,
  renameArtifactType,
  ContainerArtifactKey
} from '@/lib/storage/container-artifacts'

interface ContainerArtifactStore {
  activeArtifact: ArtifactDefinition | null
  activeArtifactId: string | null
  containerKey: ContainerArtifactKey | null
  artifacts: Array<{
    id: string
    artifact: ArtifactDefinition
    createdAt: string
    updatedAt: string
  }>
  groupedArtifacts: Array<{
    name: string
    latestVersion: ArtifactDefinition
    versions: Array<{
      id: string
      artifact: ArtifactDefinition
      createdAt: string
      updatedAt: string
    }>
  }>
  isLoading: boolean
  error: string | null

  // Actions
  loadArtifacts: (key: ContainerArtifactKey) => Promise<void>
  setActiveArtifact: (artifactId: string | null) => Promise<void>
  loadArtifact: (artifactId: string) => Promise<void>
  saveArtifact: (key: ContainerArtifactKey, artifact: ArtifactDefinition) => Promise<void>
  deleteArtifact: (artifactId: string) => Promise<void>
  deleteArtifactVersion: (artifactId: string) => Promise<void>
  clearActiveArtifact: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // New actions for version management
  getArtifactVersions: (artifactName: string) => Promise<Array<{
    id: string
    artifact: ArtifactDefinition
    createdAt: string
    updatedAt: string
  }>>
  renameArtifactType: (oldName: string, newName: string) => Promise<void>
}

export const useContainerArtifactStore = create<ContainerArtifactStore>()(
  persist(
    (set, get) => ({
      activeArtifact: null,
      activeArtifactId: null,
      containerKey: null,
      artifacts: [],
      groupedArtifacts: [],
      isLoading: false,
      error: null,

      loadArtifacts: async (key: ContainerArtifactKey) => {
        set({ isLoading: true, error: null })

        try {
          const [artifactData, groupedData] = await Promise.all([
            getArtifactsForContainer(
              key.accountName,
              key.databaseName,
              key.containerName,
              key.resourceGroup
            ),
            getArtifactsGroupedByName(
              key.accountName,
              key.databaseName,
              key.containerName,
              key.resourceGroup
            )
          ])

          const { activeArtifactId: persistedActiveId } = get()

          // Try to find the persisted active artifact, otherwise fall back to first one
          const activeArtifactData = persistedActiveId
            ? artifactData.find(a => a.id === persistedActiveId) || artifactData[0]
            : artifactData[0]

          set({
            artifacts: artifactData,
            groupedArtifacts: groupedData,
            containerKey: key,
            activeArtifactId: activeArtifactData?.id || null,
            activeArtifact: activeArtifactData?.artifact || null,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error('Failed to load container artifacts:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load artifacts',
          })
        }
      },

      setActiveArtifact: async (artifactId: string | null) => {
        const { artifacts } = get()

        if (!artifactId) {
          set({
            activeArtifactId: null,
            activeArtifact: null,
          })
          return
        }

        const artifactData = artifacts.find(a => a.id === artifactId)
        if (artifactData) {
          set({
            activeArtifactId: artifactId,
            activeArtifact: artifactData.artifact,
          })
        } else {
          // Try loading from IndexedDB if not in current artifacts array
          try {
            const artifact = await getContainerArtifact(artifactId)
            if (artifact) {
              set({
                activeArtifactId: artifactId,
                activeArtifact: artifact,
              })
            }
          } catch (error) {
            console.error('Failed to load artifact:', error)
            set({
              error: error instanceof Error ? error.message : 'Failed to load artifact',
            })
          }
        }
      },

      loadArtifact: async (artifactId: string) => {
        set({ isLoading: true, error: null })

        try {
          const artifact = await getContainerArtifact(artifactId)
          set({
            activeArtifact: artifact,
            activeArtifactId: artifactId,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error('Failed to load artifact:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load artifact',
          })
        }
      },

      saveArtifact: async (key: ContainerArtifactKey, artifact: ArtifactDefinition) => {
        set({ isLoading: true, error: null })

        try {
          await saveContainerArtifact(key, artifact)

          // Reload artifacts for this container to get the updated list
          const [artifactData, groupedData] = await Promise.all([
            getArtifactsForContainer(
              key.accountName,
              key.databaseName,
              key.containerName,
              key.resourceGroup
            ),
            getArtifactsGroupedByName(
              key.accountName,
              key.databaseName,
              key.containerName,
              key.resourceGroup
            )
          ])

          set({
            artifacts: artifactData,
            groupedArtifacts: groupedData,
            activeArtifact: artifact,
            activeArtifactId: artifact.id,
            containerKey: key,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error('Failed to save container artifact:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to save artifact',
          })
        }
      },

      deleteArtifact: async (artifactId: string) => {
        set({ isLoading: true, error: null })

        try {
          await deleteContainerArtifact(artifactId)

          const { containerKey } = get()

          // Reload artifacts to get updated list and groupings
          const [updatedArtifacts, groupedData] = await Promise.all([
            getArtifactsForContainer(
              containerKey!.accountName,
              containerKey!.databaseName,
              containerKey!.containerName,
              containerKey!.resourceGroup
            ),
            getArtifactsGroupedByName(
              containerKey!.accountName,
              containerKey!.databaseName,
              containerKey!.containerName,
              containerKey!.resourceGroup
            )
          ])

          // Clear active artifact if it was the one deleted
          const { activeArtifactId: previousActiveId } = get()
          const newActiveId = previousActiveId === artifactId
            ? (updatedArtifacts.length > 0 ? updatedArtifacts[0].id : null)
            : previousActiveId

          const newActiveArtifact = newActiveId
            ? updatedArtifacts.find(a => a.id === newActiveId)?.artifact || null
            : null

          set({
            artifacts: updatedArtifacts,
            groupedArtifacts: groupedData,
            activeArtifact: newActiveArtifact,
            activeArtifactId: newActiveId,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error('Failed to delete container artifact:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to delete artifact',
          })
        }
      },

      deleteArtifactVersion: async (artifactId: string) => {
        // This is an alias for deleteArtifact since each version is stored as a separate artifact
        return get().deleteArtifact(artifactId)
      },

      getArtifactVersions: async (artifactName: string) => {
        const { containerKey } = get()
        if (!containerKey) return []

        return await getArtifactVersions(
          containerKey.accountName,
          containerKey.databaseName,
          containerKey.containerName,
          artifactName,
          containerKey.resourceGroup
        )
      },

      renameArtifactType: async (oldName: string, newName: string) => {
        const { containerKey } = get()
        if (!containerKey) {
          throw new Error('No container context available for renaming')
        }

        set({ isLoading: true, error: null })

        try {
          await renameArtifactType(
            containerKey.accountName,
            containerKey.databaseName,
            containerKey.containerName,
            oldName,
            newName,
            containerKey.resourceGroup
          )

          // Reload artifacts to get updated data
          const [updatedArtifacts, updatedGroupedData] = await Promise.all([
            getArtifactsForContainer(
              containerKey.accountName,
              containerKey.databaseName,
              containerKey.containerName,
              containerKey.resourceGroup
            ),
            getArtifactsGroupedByName(
              containerKey.accountName,
              containerKey.databaseName,
              containerKey.containerName,
              containerKey.resourceGroup
            )
          ])

          // Update active artifact if it was renamed
          const { activeArtifact } = get()
          let newActiveArtifact = activeArtifact
          let newActiveId = activeArtifact?.id || null

          if (activeArtifact && activeArtifact.name === oldName) {
            const renamedArtifact = updatedArtifacts.find(a => a.id === activeArtifact.id)
            if (renamedArtifact) {
              newActiveArtifact = renamedArtifact.artifact
              newActiveId = renamedArtifact.id
            }
          }

          set({
            artifacts: updatedArtifacts,
            groupedArtifacts: updatedGroupedData,
            activeArtifact: newActiveArtifact,
            activeArtifactId: newActiveId,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error('Failed to rename artifact type:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to rename artifact type',
          })
          throw error
        }
      },

      clearActiveArtifact: () => {
        set({
          activeArtifact: null,
          activeArtifactId: null,
          error: null,
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },
    }),
    {
      name: 'cubad-container-artifacts-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist the container key and active artifact ID, not the full artifacts
      partialize: (state) => ({
        containerKey: state.containerKey,
        activeArtifactId: state.activeArtifactId,
        // Don't persist artifact data - it comes from IndexedDB
        activeArtifact: null,
        artifacts: [],
        groupedArtifacts: [],
        isLoading: false,
        error: null,
      }),
    }
  )
)