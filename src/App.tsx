import Dado from './components/Dado'
import './App.css'

const App: React.FC = () => {
  return (
    <Dado 
      showHistory={true}
      onRoll={(result) => console.log('Dice rolled:', result)}
      onHistoryCleared={() => console.log('History cleared')}
    />
  )
}

export default App
