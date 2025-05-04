package org.example.bank.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
@Service
public class YouTubeService {

    @Value("${youtube.api.key}")
    private String apiKey;

    @Value("${youtube.api.url}")  // Получаем полный URL из конфига
    private String youtubeUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getVideoDetails() {
        String videoId = extractVideoId(youtubeUrl);  // Извлекаем ID из URL
        String apiUrl = "https://www.googleapis.com/youtube/v3/videos";
        String url = String.format("%s?part=snippet,contentDetails&id=%s&key=%s",
                apiUrl, videoId, apiKey);
        return restTemplate.getForObject(url, String.class);
    }

    private String extractVideoId(String youtubeUrl) {
        // Для формата: https://youtu.be/VIDEO_ID
        if (youtubeUrl.contains("youtu.be/")) {
            return youtubeUrl.split("youtu.be/")[1].split("[?&]")[0];
        }
        throw new IllegalArgumentException("Invalid YouTube URL");
    }
}