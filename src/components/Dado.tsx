import { useState } from 'react'
import DiceRoller from './DiceRoller'
import RollHistory from './RollHistory'
import type { DadoAppProps } from '../types/dado'

const Dado: React.FC<DadoAppProps> = ({
  showHistory = true,
  onRoll,
  onHistoryCleared
}) => {
  const [rollHistory, setRollHistory] = useState<number[]>([])

  const handleDiceRoll = (result: number) => {
    setRollHistory(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 rolls
    onRoll?.(result)
  }

  const resetHistory = () => {
    setRollHistory([])
    onHistoryCleared?.()
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <DiceRoller onRoll={handleDiceRoll} />
      {showHistory && <RollHistory rolls={rollHistory} onClear={resetHistory} />}
    </div>
  )
}

export default Dado