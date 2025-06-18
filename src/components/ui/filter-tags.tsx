'use client'

import { useState } from 'react'

interface FilterTagsProps {
  tags: string[]
  selectedTag: string | null
  onTagSelect: (tag: string | null) => void
}

export function FilterTags({ tags, selectedTag, onTagSelect }: FilterTagsProps) {
  const [expanded, setExpanded] = useState(false)
  const displayTags = expanded ? tags : tags.slice(0, 10)

  return (
    <div className='filter-tags'>
      <div className={`filter-container ${expanded ? 'expanded' : ''}`}>
        <button
          className={`filter-tag ${selectedTag === null ? 'active' : ''}`}
          onClick={() => onTagSelect(null)}
        >
          全部
        </button>

        {displayTags.map(tag => (
          <button
            key={tag}
            className={`filter-tag ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => onTagSelect(tag)}
          >
            {tag}
          </button>
        ))}

        {tags.length > 10 && (
          <button className='filter-toggle-btn' onClick={() => setExpanded(!expanded)}>
            {expanded ? '收起' : `显示更多 (${tags.length - 10})`}
          </button>
        )}
      </div>
    </div>
  )
}
