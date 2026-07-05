import React from 'react';
import styles from './StarRating.module.css';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
}

function StarRating({ rating, onRatingChange, readOnly = false, size = 'medium' }: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (value: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readOnly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={`${styles.starRating} ${styles[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`${styles.star} ${star <= displayRating ? styles.filled : ''}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readOnly}
          type="button"
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
      {!readOnly && rating > 0 && (
        <span className={styles.ratingText}>{rating}/5</span>
      )}
    </div>
  );
}

export default StarRating;
