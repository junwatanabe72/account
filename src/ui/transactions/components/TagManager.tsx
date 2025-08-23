import React, { useCallback } from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import styles from './TagManager.module.css'

const MAX_TAGS = 5

export const TagManager: React.FC = () => {
  const {
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
  } = useJournalFormStore()
  
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput.trim())
    }
  }, [tagInput, addTag])
  
  const handleAddClick = useCallback(() => {
    if (tagInput.trim()) {
      addTag(tagInput.trim())
    }
  }, [tagInput, addTag])
  
  const canAddMoreTags = tags.length < MAX_TAGS
  
  return (
    <div className={styles.container}>
      <label className={styles.label}>
        タグ
        <span className={styles.counter}>
          ({tags.length}/{MAX_TAGS})
        </span>
      </label>
      
      {tags.length > 0 && (
        <div className={styles.tagList}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
              <button
                className={styles.removeButton}
                onClick={() => removeTag(tag)}
                aria-label={`${tag}を削除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      {canAddMoreTags && (
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="タグを入力してEnter"
            maxLength={20}
          />
          <button
            className={styles.addButton}
            onClick={handleAddClick}
            disabled={!tagInput.trim()}
          >
            追加
          </button>
        </div>
      )}
      
      {!canAddMoreTags && (
        <div className={styles.maxTagsMessage}>
          最大{MAX_TAGS}個までのタグを設定できます
        </div>
      )}
    </div>
  )
}