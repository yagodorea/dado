// Library exports for embedding in other projects

// Main component - full app experience
export { default as Dado } from './components/Dado'

// Individual components for custom layouts
export { default as DiceRoller } from './components/DiceRoller'
export { default as RollHistory } from './components/RollHistory'

// Export utility functions for advanced usage
export * from './utils/diceGeometry'
export * from './utils/diceNumbers'

// Export hooks for custom implementations
export * from './hooks/useDicePhysics'
export * from './hooks/useDiceState'

// Type exports
export type { DadoAppProps, DiceRollerProps, RollHistoryProps } from './types/dado'

// Default export is the main Dado component
export { default } from './components/Dado'