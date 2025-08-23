import React, { useState } from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import styles from './DescriptionInput.module.css'

// よく使う摘要のテンプレート
const descriptionTemplates = [
  { category: '管理費', items: ['○月分管理費', '管理費収入', '管理費返金'] },
  { category: '修繕', items: ['○月分修繕積立金', '修繕工事代金', '修繕計画策定費'] },
  { category: '委託費', items: ['管理委託費', '清掃業務委託', 'エレベーター保守'] },
  { category: '光熱費', items: ['電気料金', '水道料金', 'ガス料金'] },
  { category: 'その他', items: ['会議費', '事務用品費', '銀行手数料'] },
]

export const DescriptionInput: React.FC = () => {
  const {
    description,
    setDescription,
    errors,
    serviceMonth,
    setServiceMonth,
    payerId,
    setPayerId,
  } = useJournalFormStore()
  
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
  }
  
  const handleTemplateSelect = (template: string) => {
    // ○月を実際の月に置換
    const currentMonth = new Date().getMonth() + 1
    const replacedTemplate = template.replace('○月', `${currentMonth}月`)
    setDescription(replacedTemplate)
    setShowTemplates(false)
    setSelectedCategory(null)
  }
  
  const characterCount = description.length
  const maxCharacters = 100
  
  return (
    <div className={styles.container}>
      <div className={styles.mainSection}>
        <label className={styles.label}>
          摘要
          <span className={styles.required}>*</span>
        </label>
        
        <div className={styles.inputWrapper}>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            className={`${styles.textarea} ${errors.description ? styles.error : ''}`}
            placeholder="取引の内容を入力してください"
            maxLength={maxCharacters}
            rows={2}
          />
          
          <button
            type="button"
            className={styles.templateButton}
            onClick={() => setShowTemplates(!showTemplates)}
            title="テンプレートから選択"
          >
            📝
          </button>
        </div>
        
        <div className={styles.characterCount}>
          <span className={characterCount > maxCharacters * 0.8 ? styles.warning : ''}>
            {characterCount}/{maxCharacters}
          </span>
        </div>
        
        {errors.description && (
          <div className={styles.errorMessage}>
            {errors.description}
          </div>
        )}
      </div>
      
      {/* テンプレート選択 */}
      {showTemplates && (
        <div className={styles.templates}>
          <div className={styles.templatesHeader}>
            <span className={styles.templatesTitle}>よく使う摘要</span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => {
                setShowTemplates(false)
                setSelectedCategory(null)
              }}
            >
              ×
            </button>
          </div>
          
          {!selectedCategory ? (
            <div className={styles.categoryList}>
              {descriptionTemplates.map((cat) => (
                <button
                  key={cat.category}
                  className={styles.categoryButton}
                  onClick={() => setSelectedCategory(cat.category)}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.templateList}>
              <button
                className={styles.backButton}
                onClick={() => setSelectedCategory(null)}
              >
                ← カテゴリに戻る
              </button>
              {descriptionTemplates
                .find(cat => cat.category === selectedCategory)
                ?.items.map((item) => (
                  <button
                    key={item}
                    className={styles.templateItem}
                    onClick={() => handleTemplateSelect(item)}
                  >
                    {item}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
      
      {/* 補足情報 */}
      <div className={styles.additionalInfo}>
        <div className={styles.infoGroup}>
          <label className={styles.infoLabel}>
            サービス月
          </label>
          <input
            type="month"
            value={serviceMonth}
            onChange={(e) => setServiceMonth(e.target.value)}
            className={styles.monthInput}
          />
        </div>
        
        <div className={styles.infoGroup}>
          <label className={styles.infoLabel}>
            支払者ID
          </label>
          <input
            type="text"
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            placeholder="例: 101"
            className={styles.payerInput}
          />
        </div>
      </div>
    </div>
  )
}