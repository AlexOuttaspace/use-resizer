import React, { FC, memo } from 'react'

const getInteractionHandleStyle = (scale: number): React.CSSProperties => ({
  transform: 'translate(-50%, -50%)',
  position: 'absolute',
  cursor: 'grab',
  borderRadius: '50%',
  backgroundColor: '#fff',
  width: 15 / scale,
  height: 15 / scale,
  borderWidth: 1.5 / scale,
  borderColor: '#1baee1',
  borderStyle: 'solid'
})

export const InteractionHandle: FC<{
  positionStyles: React.CSSProperties
  scale: number
  additionalProps: React.DOMAttributes<HTMLElement>
}> = memo(
  ({ positionStyles, scale, additionalProps }) => {
    return (
      <div
        style={{ ...getInteractionHandleStyle(scale), ...positionStyles }}
        {...additionalProps}
      />
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.positionStyles.left === nextProps.positionStyles.left &&
        prevProps.positionStyles.right === nextProps.positionStyles.right &&
        prevProps.scale === nextProps.scale &&
        prevProps.positionStyles.cursor === nextProps.positionStyles.cursor,
      prevProps.additionalProps === nextProps.additionalProps
    )
  }
)
