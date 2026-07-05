import { useEffect, useState } from 'react';
import axiosInstance from '../lib/http';
import { useAuth } from '../contexts/AuthContext';
import StarRating from './StarRating';
import { formatDate } from '../lib/auth-storage';
import type {
  EventReview,
  ReviewStats,
  CreateReviewInput,
} from '../types/event';
import styles from './ReviewSection.module.css';

interface ReviewSectionProps {
  eventId: number;
}

function ReviewSection({ eventId }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<EventReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateReviewInput>({
    rating: 0,
    title: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<EventReview | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [eventId, currentPage]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.get<{
        message: string;
        data: { reviews: EventReview[]; pagination: any };
      }>(`/api/events/${eventId}/reviews?page=${currentPage}&limit=${limit}`);

      setReviews(data.data.reviews);

      // Check if user has already reviewed
      if (user) {
        const userRev = data.data.reviews.find((r) => r.userId === user.id);
        setUserReview(userRev || null);
      }
    } catch (err: any) {
      setError('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await axiosInstance.get<{
        message: string;
        data: ReviewStats;
      }>(`/api/events/${eventId}/reviews/stats`);
      setStats(data.data);
    } catch (err: any) {
      console.error('Failed to load review stats');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rating || formData.rating < 1) {
      setError('Please select a rating');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a review title');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await axiosInstance.post<{
        message: string;
        data: EventReview;
      }>(`/api/events/${eventId}/reviews`, {
        rating: formData.rating,
        title: formData.title,
        description: formData.description || undefined,
      });

      setUserReview(response.data.data);
      setFormData({ rating: 0, title: '', description: '' });
      setShowForm(false);

      // Reload reviews and stats
      await loadReviews();
      await loadStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    if (!confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      await axiosInstance.delete(
        `/api/events/${eventId}/reviews/${userReview.id}`
      );
      setUserReview(null);
      await loadReviews();
      await loadStats();
    } catch (err: any) {
      setError('Failed to delete review');
    }
  };

  const getRatingPercentage = (count: number) => {
    if (!stats || stats.totalReviews === 0) return 0;
    return Math.round((count / stats.totalReviews) * 100);
  };

  return (
    <div className={styles.reviewSection}>
      <h2 className={styles.title}>Reviews & Ratings</h2>

      {/* Stats Section */}
      {stats && (
        <div className={styles.statsContainer}>
          <div className={styles.ratingBox}>
            <div className={styles.ratingNumber}>
              {stats.averageRating.toFixed(1)}
            </div>
            <StarRating
              rating={Math.round(stats.averageRating)}
              readOnly
              size="small"
            />
            <div className={styles.reviewCount}>
              ({stats.totalReviews} reviews)
            </div>
          </div>

          <div className={styles.distributionBox}>
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className={styles.distributionRow}>
                <span className={styles.starLabel}>{star}★</span>
                <div className={styles.barContainer}>
                  <div
                    className={styles.bar}
                    style={{
                      width: `${getRatingPercentage(stats.ratingDistribution[star as keyof typeof stats.ratingDistribution])}%`,
                    }}
                  />
                </div>
                <span className={styles.barLabel}>
                  {
                    stats.ratingDistribution[
                      star as keyof typeof stats.ratingDistribution
                    ]
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Review Form */}
      {user && !userReview && (
        <div className={styles.formSection}>
          {!showForm ? (
            <button
              className={styles.writeReviewBtn}
              onClick={() => setShowForm(true)}
            >
              + Write a Review
            </button>
          ) : (
            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
              <h3>Write Your Review</h3>

              <div className={styles.formGroup}>
                <label>Rating *</label>
                <StarRating
                  rating={formData.rating}
                  onRatingChange={(r) =>
                    setFormData({ ...formData, rating: r })
                  }
                  size="large"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Summarize your experience"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  maxLength={100}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Review (optional)</label>
                <textarea
                  id="description"
                  placeholder="Share your detailed thoughts..."
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  maxLength={1000}
                  rows={4}
                />
                <small>{(formData.description || '').length}/1000</small>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.formActions}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitBtn}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* User's Review Display */}
      {userReview && (
        <div className={styles.userReviewBox}>
          <div className={styles.reviewHeader}>
            <div>
              <h4>Your Review</h4>
              <StarRating rating={userReview.rating} readOnly size="small" />
            </div>
            <button onClick={handleDeleteReview} className={styles.deleteBtn}>
              Delete
            </button>
          </div>
          <p className={styles.reviewTitle}>{userReview.title}</p>
          {userReview.description && (
            <p className={styles.reviewText}>{userReview.description}</p>
          )}
          <small className={styles.reviewDate}>
            {formatDate(userReview.createdAt)}
          </small>
        </div>
      )}

      {/* Reviews List */}
      <div className={styles.reviewsList}>
        <h3>All Reviews</h3>
        {isLoading && <p>Loading reviews...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {reviews.length === 0 && !isLoading && (
          <p className={styles.noReviews}>
            No reviews yet. Be the first to review!
          </p>
        )}

        {reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            <div className={styles.reviewCardHeader}>
              <div>
                <h4>{review.user.name}</h4>
                <StarRating rating={review.rating} readOnly size="small" />
              </div>
              <small className={styles.reviewDate}>
                {formatDate(review.createdAt)}
              </small>
            </div>
            <p className={styles.reviewTitle}>{review.title}</p>
            {review.description && (
              <p className={styles.reviewText}>{review.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReviewSection;
