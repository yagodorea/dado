import type { RollHistoryProps } from '../types/dado'

const RollHistory: React.FC<RollHistoryProps> = ({ 
  rolls, 
  onClear,
  style,
  className 
}) => {
  if (rolls.length === 0) return null

  return (
    <div 
      className={className}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'white',
        borderRadius: '10px',
        padding: '15px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        maxWidth: '200px',
        ...style
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Roll History</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
        {rolls.map((roll, index) => (
          <span 
            key={index}
            style={{
              background: index === 0 ? '#44aa88' : '#f0f0f0',
              color: index === 0 ? 'white' : 'black',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: index === 0 ? 'bold' : 'normal'
            }}
          >
            {roll}
          </span>
        ))}
      </div>
      <button 
        onClick={onClear}
        style={{
          width: '100%',
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
        onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#c82333'}
        onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545'}
      >
        🗑️ Clear History
      </button>
    </div>
  )
}

export default RollHistory