from flask import Blueprint, jsonify
from ..services.sign_service import SignService

sign_bp = Blueprint('sign', __name__)
sign_service = SignService()

@sign_bp.route('/<query>', methods=['GET'])
def get_sign(query):
    try:
        sign_data = sign_service.get_sign(query)
        return jsonify(sign_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 404
