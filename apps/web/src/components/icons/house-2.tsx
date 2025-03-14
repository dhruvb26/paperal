import React from 'react'

interface House2Props {
  title?: string
}

function House2({ title = 'house 2' }: House2Props) {
  const color = 'hsl(var(--foreground))'

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill={color}>
        <line
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          x1="9"
          x2="9"
          y1="16"
          y2="12.75"
        />
        <path
          d="M3.145,6.2l5.25-3.99c.358-.272,.853-.272,1.21,0l5.25,3.99c.249,.189,.395,.484,.395,.796v7.254c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2V6.996c0-.313,.146-.607,.395-.796Z"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
      </g>
    </svg>
  )
}

export default House2
