// Type definitions for Dado library

export interface DiceRollerProps {
  onRoll?: (result: number) => void
  /**
   * Whether to show the roll history panel
   * @default false
   */
  showHistory?: boolean
  /**
   * Maximum number of rolls to keep in history
   * @default 10
   */
  maxHistory?: number
  /**
   * Custom styling for the dice roller container
   */
  style?: React.CSSProperties
  /**
   * Custom class name for the dice roller container
   */
  className?: string
}

export interface RollHistoryProps {
  /**
   * Array of roll results to display
   */
  rolls: number[]
  /**
   * Called when clear button is clicked
   */
  onClear: () => void
  /**
   * Custom styling for the history panel
   */
  style?: React.CSSProperties
  /**
   * Custom class name for the history panel
   */
  className?: string
}

export interface DadoAppProps {
  /**
   * Whether to show the roll history
   * @default true
   */
  showHistory?: boolean
  /**
   * Called when a dice roll completes
   */
  onRoll?: (result: number) => void
  /**
   * Called when history is cleared
   */
  onHistoryCleared?: () => void
}