from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    limiter.init_app(app)
    
    from .routes.youtube import youtube_bp
    from .routes.sign import sign_bp
    
    app.register_blueprint(youtube_bp, url_prefix='/api/youtube')
    app.register_blueprint(sign_bp, url_prefix='/api/sign')
    
    @app.route('/health')
    def health():
        return {"status": "healthy"}, 200
        
    return app
