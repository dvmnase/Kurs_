import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import styles from './YouTubeVideo.module.css';

const YouTubeVideo = () => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = authService.getToken();
    console.log('Token:', token);

    if (!token) {
      setError(new Error('Требуется авторизация'));
      setLoading(false);
      return;
    }

    console.log('Sending request with token:', token);

    fetch('http://localhost:8080/api/youtube/video', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Received data:', data);
        setVideoData(data.items[0]);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error details:', error);
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error.message}</div>;
  if (!videoData) return <div className={styles.error}>No video data</div>;

  return (
    <div className={styles.youtubeVideo}>
      <h2>{videoData.snippet.title}</h2>
      <div className={styles.videoContainer}>
        <iframe
          src={`https://www.youtube.com/embed/${videoData.id}`}
          title={videoData.snippet.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <p className={styles.description}>{videoData.snippet.description}</p>
    </div>
  );
};

export default YouTubeVideo;