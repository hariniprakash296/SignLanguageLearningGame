from flask import Blueprint, request, jsonify
from ..services.youtube_service import YouTubeService

youtube_bp = Blueprint('youtube', __name__)
youtube_service = YouTubeService()

@youtube_bp.route('/extract', methods=['POST'])
def extract_transcript():
    data = request.get_json()
    video_url = data.get('url')
    
    if not video_url:
        return jsonify({"error": "No URL provided"}), 400
        
    try:
        transcript = youtube_service.get_transcript(video_url)
        return jsonify({"transcript": transcript}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
