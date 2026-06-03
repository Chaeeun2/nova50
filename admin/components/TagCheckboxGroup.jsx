function TagCheckboxGroup({ idPrefix, tagOptions, tags, onChange, ariaLabel, enabledTags }) {
  return (
    <div className="admin-tag-checkbox-grid" role="group" aria-label={ariaLabel}>
      {tagOptions.map((tag) => {
        const inputId = `${idPrefix}-${tag.replace(/\s+/g, '-').toLowerCase()}`
        const isChecked = tags.includes(tag)
        const isDisabled = enabledTags !== undefined && !enabledTags.includes(tag)

        return (
          <label
            key={tag}
            className={`admin-tag-checkbox${isDisabled ? ' is-disabled' : ''}`}
            htmlFor={inputId}
          >
            <input
              id={inputId}
              type="checkbox"
              checked={isChecked}
              disabled={isDisabled}
              onChange={() => onChange(tag)}
            />
            <span>{tag}</span>
          </label>
        )
      })}
    </div>
  )
}

export default TagCheckboxGroup
