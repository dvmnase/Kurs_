import React from 'react'
import Image from 'next/image'
import useDarkMode from 'use-dark-mode'

const ImageApp = ({
  className,
  src,
  srcDark,
  alt,
  size,
  priority,
  objectFit = 'contain',
}) => {
  const darkMode = useDarkMode(false)
  const imageSrc = darkMode.value && srcDark ? srcDark : src

  if (!imageSrc || typeof imageSrc !== 'string') {
    console.warn('Image component is missing required "src" property')
    return null
  }

  return (
    <div className={className} style={{ ...size, position: 'relative' }}>
      <Image
        src={imageSrc}
        alt={alt || ''}
        layout="fill"
        quality={60}
        objectFit={objectFit}
        placeholder="blur"
        blurDataURL={`${imageSrc}?auto=format,compress&q=1&blur=500&w=2`}
        priority={priority}
      />
    </div>
  )
}

export default ImageApp
