from youtube_transcript_api import YouTubeTranscriptApi
import re

class YouTubeService:
    def get_video_id(self, url):
        # Extract video ID from youtube URL
        pattern = r'(?:v=|\/)([0-9A-Za-z_-]{11}).*'
        match = re.search(pattern, url)
        if match:
            return match.group(1)
        return None

    def get_transcript(self, url):
        video_id = self.get_video_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL")
            
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            return transcript_list
        except Exception as e:
            # Check if captions are disabled or other issues
            raise Exception(f"Could not retrieve transcript: {str(e)}")
