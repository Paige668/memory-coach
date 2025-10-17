# backend/routes/profile.py
from flask import request, jsonify
from flask_login import login_required, current_user
from backend.config import db
from backend.models.user_model import User

def _ok(payload, status=200):
    return jsonify(payload), status

def _err(message, status=400):
    return jsonify({"error": message}), status

def _json():
    return request.get_json(silent=True) or {}

def register(app):
    # Get user profile
    @app.route('/api/profile', methods=['GET'])
    @login_required
    def get_profile():
        try:
            user = current_user
            profile_data = {
                'id': user.id,
                'name': user.name or '',
                'email': user.email,
                'phone': user.phone or '',
                'address': user.address or '',
                'emergency_contact': user.emergency_contact or '',
                'caregiver_email': user.caregiver_email or '',
            }
            return _ok(profile_data)
        except Exception as e:
            return _err(f"Failed to get profile: {str(e)}", 500)

    # Update user profile
    @app.route('/api/profile', methods=['PUT'])
    @login_required
    def update_profile():
        try:
            data = _json()
            user = current_user
            
            # Update fields if provided
            if 'name' in data:
                user.name = data['name'].strip() if data['name'] else None
            if 'phone' in data:
                user.phone = data['phone'].strip() if data['phone'] else None
            if 'address' in data:
                user.address = data['address'].strip() if data['address'] else None
            if 'emergency_contact' in data:
                user.emergency_contact = data['emergency_contact'].strip() if data['emergency_contact'] else None
            if 'caregiver_email' in data:
                user.caregiver_email = data['caregiver_email'].strip() if data['caregiver_email'] else None
            
            # Email cannot be changed through profile update
            # This should be a separate secure process if needed
            
            db.session.commit()
            
            return _ok({
                'message': 'Profile updated successfully',
                'profile': {
                    'id': user.id,
                    'name': user.name or '',
                    'email': user.email,
                    'phone': user.phone or '',
                    'address': user.address or '',
                    'emergency_contact': user.emergency_contact or '',
                    'caregiver_email': user.caregiver_email or '',
                }
            })
            
        except Exception as e:
            db.session.rollback()
            return _err(f"Failed to update profile: {str(e)}", 500)

    # Check if user has completed profile setup
    @app.route('/api/profile/status', methods=['GET'])
    @login_required
    def get_profile_status():
        try:
            user = current_user
            required_fields = ['name', 'phone', 'emergency_contact']
            missing_fields = []
            
            for field in required_fields:
                if not getattr(user, field):
                    missing_fields.append(field)
            
            is_complete = len(missing_fields) == 0
            
            return _ok({
                'is_complete': is_complete,
                'missing_fields': missing_fields,
                'completion_percentage': int(((len(required_fields) - len(missing_fields)) / len(required_fields)) * 100)
            })
            
        except Exception as e:
            return _err(f"Failed to check profile status: {str(e)}", 500)
