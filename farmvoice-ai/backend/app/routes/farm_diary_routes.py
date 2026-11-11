from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)

from app import db
from app.models.farmer import Farmer
from app.models.farmer_crop import FarmerCrop
from app.models.farm_activities import FarmActivity
from app.models.fertilizer_records import FertilizerRecord
from app.models.irrigation_records import IrrigationRecord
from app.models.pest_management_records import PestManagementRecord
from app.models.harvest_records import HarvestRecord
from app.models.farm_expenses import FarmExpense

farm_diary_bp = Blueprint("farm_diary", __name__)
"""FarmVoice AI - Farm Diary REST API routes (Flask blueprint)."""
farm_diary_bp = Blueprint("farm_diary", __name__)
from flask import Blueprint, jsonify, request, make_response

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)

from app import db
from app.models.farmer import Farmer
from app.models.farmer_crop import FarmerCrop
from app.models.farm_activities import FarmActivity
from app.models.fertilizer_records import FertilizerRecord
@farm_diary_bp.route("/crops", methods=["GET"])
@jwt_required()
def list_crops():
    farmer, err = _get_current_farmer()
    if err:
        return err
    crops = FarmerCrop.query.filter_by(user_id=farmer.farmer_id).all()
    return jsonify({"success": True, "crops": [c.to_dict() for c in crops]}), 200


@farm_diary_bp.route("/crops", methods=["POST"])
@jwt_required()
def add_crop():
    farmer, err = _get_current_farmer()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    crop_name = (data.get("crop_name") or "").strip()
    if not crop_name:
        return jsonify({"success": False, "message": "Crop name is required."}), 400
    crop_variety = (data.get("crop_variety") or "").strip() or None
    land_area = data.get("land_area")
    try:
        land_area = float(land_area) if land_area and str(land_area).strip() else None
    except (ValueError, TypeError):
        land_area = None
    if land_area is not None and land_area <= 0:
        return jsonify({"success": False, "message": "Land area must be greater than zero."}), 400
    sowing_date = data.get("sowing_date")
    expected_harvest_date = data.get("expected_harvest_date")
    if sowing_date:
        try:
            from datetime import datetime
            sowing_date = datetime.strptime(str(sowing_date), "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Invalid sowing date format. Use YYYY-MM-DD."}), 400
    if expected_harvest_date:
        try:
            from datetime import datetime
            datetime.strptime(str(expected_harvest_date), "%Y-%m-%d")
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Invalid expected harvest date format. Use YYYY-MM-DD."}), 400
    season = data.get("season")
    valid_seasons = ["Kharif", "Rabi", "Zaid", "Other"]
    if season and season not in valid_seasons:
        return jsonify({"success": False, "message": f"Invalid season. Must be one of: {', '.join(valid_seasons)}."}), 400
    crop_status = data.get("crop_status", "Planned")
    valid_statuses = ["Planned", "Growing", "Harvested"]
    if crop_status and crop_status not in valid_statuses:
        return jsonify({"success": False, "message": f"Invalid crop status. Must be one of: {', '.join(valid_statuses)}."}), 400
    existing = FarmerCrop.query.filter_by(user_id=farmer.farmer_id, crop_name=crop_name).first()
    if existing:
        return jsonify({"success": False, "message": f"Crop '{crop_name}' already registered."}), 409
    new_crop = FarmerCrop(
        user_id=farmer.farmer_id,
        crop_name=crop_name,
        crop_variety=crop_variety,
        land_area=land_area,
        sowing_date=sowing_date,
        expected_harvest_date=expected_harvest_date,
        season=season,
        crop_status=crop_status,
    )
    try:
        db.session.add(new_crop)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to register crop. Please try again."}), 500
    return jsonify({"success": True, "message": "Crop registered successfully.", "crop": new_crop.to_dict()}), 201
from app.models.irrigation_records import IrrigationRecord
from app.models.pest_management_records import PestManagementRecord
from app.models.harvest_records import HarvestRecord
from app.models.farm_expenses import FarmExpense




def _get_current_farmer():
    try:
        farmer_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None, jsonify({"success": False, "message": "Invalid user identity."}), 401
    farmer = Farmer.query.get(farmer_id)
    if not farmer:
        return None, jsonify({"success": False, "message": "Farmer not found."}), 404
    return farmer, None
@farm_diary_bp.route("/crops/<int:crop_id>", methods=["GET"])
@jwt_required()
def get_crop(crop_id):
    farmer, err = _get_current_farmer()
    if err:
        return err
    crop = FarmerCrop.query.filter_by(crop_id=crop_id, user_id=farmer.farmer_id).first()
    if not crop:
        return jsonify({"success": False, "message": "Crop not found."}), 404
    return jsonify({"success": True, "crop": crop.to_dict()}), 200


@farm_diary_bp.route("/crops/<int:crop_id>", methods=["PUT"])
@jwt_required()
def update_crop(crop_id):
    farmer, err = _get_current_farmer()
    if err:
        return err
    crop = FarmerCrop.query.filter_by(crop_id=crop_id, user_id=farmer.farmer_id).first()
    if not crop:
        return jsonify({"success": False, "message": "Crop not found."}), 404
    data = request.get_json(silent=True) or {}
    crop_name = data.get("crop_name")
    if crop_name:
        crop.crop_name = crop_name.strip()
    crop_variety = data.get("crop_variety")
    if crop_variety is not None:
        crop.crop_variety = crop_variety.strip() or None
    land_area = data.get("land_area")
    if land_area is not None:
        try:
            land_area = float(land_area) if str(land_area).strip() else None
        except (ValueError, TypeError):
            land_area = None
        if land_area is not None and land_area <= 0:
            return jsonify({"success": False, "message": "Land area must be greater than zero."}), 400
        crop.land_area = land_area
    sowing_date = data.get("sowing_date")
    if sowing_date is not None:
        if sowing_date:
            try:
                from datetime import datetime
                datetime.strptime(str(sowing_date), "%Y-%m-%d")
                crop.sowing_date = sowing_date
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": "Invalid sowing date format. Use YYYY-MM-DD."}), 400
        else:
            crop.sowing_date = None
    expected_harvest_date = data.get("expected_harvest_date")
    if expected_harvest_date is not None:
        if expected_harvest_date:
            try:
                from datetime import datetime
                datetime.strptime(str(expected_harvest_date), "%Y-%m-%d")
                crop.expected_harvest_date = expected_harvest_date
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": "Invalid expected harvest date format. Use YYYY-MM-DD."}), 400
        else:
            crop.expected_harvest_date = None
    season = data.get("season")
    if season:
        valid_seasons = ["Kharif", "Rabi", "Zaid", "Other"]
        if season not in valid_seasons:
            return jsonify({"success": False, "message": f"Invalid season. Must be one of: {', '.join(valid_seasons)}."}), 400
        crop.season = season
    crop_status = data.get("crop_status")
    if crop_status:
        valid_statuses = ["Planned", "Growing", "Harvested"]
        if crop_status not in valid_statuses:
            return jsonify({"success": False, "message": f"Invalid crop status. Must be one of: {', '.join(valid_statuses)}."}), 400
        crop.crop_status = crop_status
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to update crop. Please try again."}), 500
    return jsonify({"success": True, "message": "Crop updated successfully.", "crop": crop.to_dict()}), 200


@farm_diary_bp.route("/crops/<int:crop_id>", methods=["DELETE"])
@jwt_required()
def delete_crop(crop_id):
    farmer, err = _get_current_farmer()
    if err:
        return err
    crop = FarmerCrop.query.filter_by(crop_id=crop_id, user_id=farmer.farmer_id).first()
    if not crop:
        return jsonify({"success": False, "message": "Crop not found."}), 404
    FarmActivity.query.filter_by(crop_id=crop_id).delete()
    FertilizerRecord.query.filter_by(crop_id=crop_id).delete()
    IrrigationRecord.query.filter_by(crop_id=crop_id).delete()
    PestManagementRecord.query.filter_by(crop_id=crop_id).delete()
    HarvestRecord.query.filter_by(crop_id=crop_id).delete()
    FarmExpense.query.filter_by(crop_id=crop_id).delete()
    try:
        db.session.delete(crop)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to delete crop. Please try again."}), 500
    return jsonify({"success": True, "message": "Crop deleted successfully."}), 200
@farm_diary_bp.route("/activities", methods=["GET"])
@jwt_required()
def list_activities():
    farmer, err = _get_current_farmer()
    if err:
        return err
    activity_type_filter = request.args.get("type")
    crop_id_filter = request.args.get("crop_id")
    date_filter = request.args.get("date")
    query = FarmActivity.query.filter_by(user_id=farmer.farmer_id)
    if crop_id_filter:
        try:
            query = query.filter_by(crop_id=int(crop_id_filter))
        except (ValueError, TypeError):
            pass
    if activity_type_filter:
        query = query.filter_by(activity_type=activity_type_filter)
    if date_filter:
        from datetime import datetime
        try:
            date_val = datetime.strptime(date_filter, "%Y-%m-%d").date()
            query = query.filter(FarmActivity.activity_date == date_val)
        except (ValueError, TypeError):
            pass
    activities = query.order_by(FarmActivity.activity_date.desc()).all()
@farm_diary_bp.route("/activities", methods=["POST"])
@jwt_required()
def add_activity():
    farmer, err = _get_current_farmer()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    activity_date = data.get("activity_date")
    if not activity_date:
        return jsonify({"success": False, "message": "Activity date is required."}), 400
    try:
        from datetime import datetime
        activity_date = datetime.strptime(str(activity_date), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid activity date format. Use YYYY-MM-DD."}), 400
    activity_type = data.get("activity_type")
    valid_types = ["Land Preparation", "Sowing", "Irrigation", "Fertilizer Application", "Pesticide Application", "Weed Control", "Pruning", "Pest and Disease Observation", "Harvesting", "Other Activities"]
    if not activity_type or activity_type not in valid_types:
        return jsonify({"success": False, "message": f"Invalid activity type. Must be one of: {', '.join(valid_types)}."}), 400
    crop_name = (data.get("crop_name") or "").strip()
    crop_id = None
    if crop_name:
        crop = FarmerCrop.query.filter_by(user_id=farmer.farmer_id, crop_name=crop_name).first()
        if crop:
            crop_id = crop.crop_id
    activity_description = (data.get("activity_description") or "").strip()
    if not activity_description:
        return jsonify({"success": False, "message": "Activity description is required."}), 400
    notes = (data.get("notes") or "").strip() or None
    new_activity = FarmActivity(user_id=farmer.farmer_id, crop_id=crop_id, activity_date=activity_date, activity_type=activity_type, activity_description=activity_description, notes=notes)
    try:
        db.session.add(new_activity)
        db.session.commit()
    except Exception:
        db.session.rollback()
@farm_diary_bp.route("/activities/<int:activity_id>", methods=["PUT"])
@jwt_required()
def update_activity(activity_id):
    farmer, err = _get_current_farmer()
    if err:
        return err
    activity = FarmActivity.query.filter_by(activity_id=activity_id, user_id=farmer.farmer_id).first()
    if not activity:
        return jsonify({"success": False, "message": "Activity not found."}), 404
    data = request.get_json(silent=True) or {}
    activity_date = data.get("activity_date")
    if activity_date is not None:
        if activity_date:
            try:
                from datetime import datetime
                activity_date = datetime.strptime(str(activity_date), "%Y-%m-%d").date()
                activity.activity_date = activity_date
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": "Invalid activity date format. Use YYYY-MM-DD."}), 400
        else:
            activity.activity_date = None
    activity_type = data.get("activity_type")
    if activity_type:
        valid_types = ["Land Preparation", "Sowing", "Irrigation", "Fertilizer Application", "Pesticide Application", "Weed Control", "Pruning", "Pest and Disease Observation", "Harvesting", "Other Activities"]
        if activity_type not in valid_types:
            return jsonify({"success": False, "message": f"Invalid activity type. Must be one of: {', '.join(valid_types)}."}), 400
        activity.activity_type = activity_type
    activity_description = data.get("activity_description")
    if activity_description is not None:
        activity_description = (activity_description or "").strip()
        if not activity_description:
            return jsonify({"success": False, "message": "Activity description is required."}), 400
        activity.activity_description = activity_description
    notes = data.get("notes")
    if notes is not None:
        activity.notes = (notes or "").strip() or None
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to update activity. Please try again."}), 500
    return jsonify({"success": True, "message": "Activity updated successfully.", "activity": activity.to_dict()}), 200


@farm_diary_bp.route("/activities/<int:activity_id>", methods=["DELETE"])
@jwt_required()
def delete_activity(activity_id):
    farmer, err = _get_current_farmer()
    if err:
        return err
    activity = FarmActivity.query.filter_by(activity_id=activity_id, user_id=farmer.farmer_id).first()
    if not activity:
        return jsonify({"success": False, "message": "Activity not found."}), 404
    try:
        db.session.delete(activity)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to delete activity. Please try again."}), 500
    return jsonify({"success": True, "message": "Activity deleted successfully."}), 200
    return jsonify({"success": True, "activities": [a.to_dict() for a in activities]}), 200
@farm_diary_bp.route("/fertilizers", methods=["GET"])
@jwt_required()
def list_fertilizers():
    farmer, err = _get_current_farmer()
    if err:
        return err
    crop_id_filter = request.args.get("crop_id")
    query = FertilizerRecord.query.filter_by(user_id=farmer.farmer_id)
    if crop_id_filter:
        try:
            query = query.filter_by(crop_id=int(crop_id_filter))
        except (ValueError, TypeError):
            pass
    records = query.order_by(FertilizerRecord.application_date.desc()).all()
    return jsonify({"success": True, "fertilizer_records": [r.to_dict() for r in records]}), 200


@farm_diary_bp.route("/fertilizers", methods=["POST"])
@jwt_required()
def add_fertilizer():
    farmer, err = _get_current_farmer()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    fertilizer_name = (data.get("fertilizer_name") or "").strip()
    if not fertilizer_name:
        return jsonify({"success": False, "message": "Fertilizer name is required."}), 400
    fertilizer_type = (data.get("fertilizer_type") or "").strip()
    if not fertilizer_type:
        return jsonify({"success": False, "message": "Fertilizer type is required."}), 400
    quantity_used = data.get("quantity_used")
    try:
        quantity_used = float(quantity_used) if quantity_used and str(quantity_used).strip() else None
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid quantity used."}), 400
    if quantity_used is not None and quantity_used <= 0:
        return jsonify({"success": False, "message": "Quantity used must be greater than zero."}), 400
    application_date = data.get("application_date")
    if not application_date:
        return jsonify({"success": False, "message": "Application date is required."}), 400
    try:
        from datetime import datetime
        application_date = datetime.strptime(str(application_date), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid application date format. Use YYYY-MM-DD."}), 400
    crop_name = (data.get("crop_name") or "").strip()
    crop_id = None
    if crop_name:
        crop = FarmerCrop.query.filter_by(user_id=farmer.farmer_id, crop_name=crop_name).first()
        if crop:
            crop_id = crop.crop_id
    notes = (data.get("notes") or "").strip() or None
    new_record = FertilizerRecord(user_id=farmer.farmer_id, crop_id=crop_id, fertilizer_name=fertilizer_name, fertilizer_type=fertilizer_type, quantity_used=quantity_used, application_date=application_date, notes=notes)
    try:
        db.session.add(new_record)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to record fertilizer application. Please try again."}), 500
    return jsonify({"success": True, "message": "Fertilizer record saved successfully.", "record": new_record.to_dict()}), 201
@farm_diary_bp.route("/irrigation", methods=["GET"])
@jwt_required()
def list_irrigation():
    farmer, err = _get_current_farmer()
    if err:
        return err
    crop_id_filter = request.args.get("crop_id")
    method_filter = request.args.get("method")
    date_filter = request.args.get("date")
    query = IrrigationRecord.query.filter_by(user_id=farmer.farmer_id)
    if crop_id_filter:
        try:
            query = query.filter_by(crop_id=int(crop_id_filter))
        except (ValueError, TypeError):
            pass
    if method_filter:
        query = query.filter_by(irrigation_method=method_filter)
    if date_filter:
        from datetime import datetime
        try:
            date_val = datetime.strptime(date_filter, "%Y-%m-%d").date()
            query = query.filter(IrrigationRecord.irrigation_date == date_val)
        except (ValueError, TypeError):
            pass
    records = query.order_by(IrrigationRecord.irrigation_date.desc()).all()
    return jsonify({"success": True, "irrigation_records": [r.to_dict() for r in records]}), 200


@farm_diary_bp.route("/irrigation", methods=["POST"])
@jwt_required()
def add_irrigation():
    farmer, err = _get_current_farmer()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    irrigation_date = data.get("irrigation_date")
    if not irrigation_date:
        return jsonify({"success": False, "message": "Irrigation date is required."}), 400
    try:
        from datetime import datetime
        irrigation_date = datetime.strptime(str(irrigation_date), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid irrigation date format. Use YYYY-MM-DD."}), 400
    irrigation_method = (data.get("irrigation_method") or "").strip()
    valid_methods = ["Drip Irrigation", "Sprinkler Irrigation", "Flood Irrigation", "Rainfed", "Other"]
    if not irrigation_method or irrigation_method not in valid_methods:
        return jsonify({"success": False, "message": f"Invalid irrigation method. Must be one of: {', '.join(valid_methods)}."}), 400
    duration = (data.get("duration") or "").strip()
    if not duration:
        return jsonify({"success": False, "message": "Duration is required."}), 400
    water_usage = data.get("water_usage")
    if water_usage is not None:
        try: water_usage = float(water_usage) if str(water_usage).strip() else None
        except (ValueError, TypeError): water_usage = None
    crop_name = (data.get("crop_name") or "").strip()
    crop_id = None
    if crop_name:
        crop = FarmerCrop.query.filter_by(user_id=farmer.farmer_id, crop_name=crop_name).first()
        if crop: crop_id = crop.crop_id
    notes = (data.get("notes") or "").strip() or None
    new_record = IrrigationRecord(user_id=farmer.farmer_id, crop_id=crop_id, irrigation_date=irrigation_date, irrigation_method=irrigation_method, duration=duration, water_usage=water_usage, notes=notes)
    try:
        db.session.add(new_record)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to record irrigation. Please try again."}), 500
    return jsonify({"success": True, "message": "Irrigation record saved successfully.", "record": new_record.to_dict()}), 201
@farm_diary_bp.route("/pest-management", methods=["GET"])
@jwt_required()
def list_pest_management():
    farmer, err = _get_current_farmer()
    if err:
        return err
    crop_id_filter = request.args.get("crop_id")
    record_type_filter = request.args.get("type")
    date_filter = request.args.get("date")
    query = PestManagementRecord.query.filter_by(user_id=farmer.farmer_id)
    if crop_id_filter:
        try:
            query = query.filter_by(crop_id=int(crop_id_filter))
        except (ValueError, TypeError):
            pass
    if record_type_filter:
        query = query.filter_by(record_type=record_type_filter)
    if date_filter:
        from datetime import datetime
        try:
            date_val = datetime.strptime(date_filter, "%Y-%m-%d").date()
            query = query.filter(PestManagementRecord.application_or_observation_date == date_val)
        except (ValueError, TypeError):
            pass
    records = query.order_by(PestManagementRecord.application_or_observation_date.desc()).all()
    return jsonify({"success": True, "pest_management_records": [r.to_dict() for r in records]}), 200


@farm_diary_bp.route("/pest-management", methods=["POST"])
@jwt_required()
def add_pest_management():
    farmer, err = _get_current_farmer()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    record_type = (data.get("record_type") or "").strip()
    valid_types = ["Pesticide Application", "Pest Observation"]
    if not record_type or record_type not in valid_types:
        return jsonify({"success": False, "message": f"Invalid record type. Must be one of: {', '.join(valid_types)}."}), 400
    crop_name = (data.get("crop_name") or "").strip()
    crop_id = None
    if record_type == "Pesticide Application" and crop_name:
        crop = FarmerCrop.query.filter_by(user_id=farmer.farmer_id, crop_name=crop_name).first()
        if crop:
            crop_id = crop.crop_id
    pesticide_name = None
    if record_type == "Pesticide Application":
        pesticide_name = (data.get("pesticide_name") or "").strip() or None
    pest_or_disease_name = (data.get("pest_or_disease_name") or "").strip()
    if not pest_or_disease_name:
        return jsonify({"success": False, "message": "Pest or disease name is required."}), 400
    application_date = data.get("application_or_observation_date")
    if not application_date:
        return jsonify({"success": False, "message": "Application or observation date is required."}), 400
    try:
        from datetime import datetime
        application_date = datetime.strptime(str(application_date), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid date format. Use YYYY-MM-DD."}), 400
    notes = (data.get("notes") or "").strip() or None
    new_record = PestManagementRecord(user_id=farmer.farmer_id, crop_id=crop_id, record_type=record_type, pesticide_name=pesticide_name, pest_or_disease_name=pest_or_disease_name, application_or_observation_date=application_date, notes=notes)
    try:
        db.session.add(new_record)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to record pest management entry. Please try again."}), 500
    return jsonify({"success": True, "message": "Pest management record saved successfully.", "record": new_record.to_dict()}), 201
@farm_diary_bp.route("/harvest", methods=["GET"])
@jwt_required()
def list_harvest():
    farmer, err = _get_current_farmer()
    if err:
        return err
    crop_id_filter = request.args.get("crop_id")
    date_filter = request.args.get("date")
    query = HarvestRecord.query.filter_by(user_id=farmer.farmer_id)
    if crop_id_filter:
        try:
            query = query.filter_by(crop_id=int(crop_id_filter))
        except (ValueError, TypeError):
            pass
    if date_filter:
        from datetime import datetime
        try:
            date_val = datetime.strptime(date_filter, "%Y-%m-%d").date()
            query = query.filter(HarvestRecord.harvest_date == date_val)
        except (ValueError, TypeError):
            pass
    records = query.order_by(HarvestRecord.harvest_date.desc()).all()
    return jsonify({"success": True, "harvest_records": [r.to_dict() for r in records]}), 200


@farm_diary_bp.route("/harvest", methods=["POST"])
@jwt_required()
def add_harvest():
    farmer, err = _get_current_farmer()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    harvest_date = data.get("harvest_date")
    if not harvest_date:
        return jsonify({"success": False, "message": "Harvest date is required."}), 400
    try:
        from datetime import datetime
        harvest_date = datetime.strptime(str(harvest_date), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid harvest date format. Use YYYY-MM-DD."}), 400
    crop_name = (data.get("crop_name") or "").strip()
    crop_id = None
    if crop_name:
        crop = FarmerCrop.query.filter_by(user_id=farmer.farmer_id, crop_name=crop_name).first()
        if crop:
            crop_id = crop.crop_id
    quantity_harvested = data.get("quantity_harvested")
    try:
        quantity_harvested = float(quantity_harvested) if quantity_harvested and str(quantity_harvested).strip() else None
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid quantity harvested."}), 400
    if quantity_harvested is not None and quantity_harvested <= 0:
        return jsonify({"success": False, "message": "Quantity harvested must be greater than zero."}), 400
    quantity_unit = (data.get("quantity_unit") or "").strip().lower()
    valid_units = ["kg", "quintal", "tonne"]
    if quantity_unit not in valid_units:
        return jsonify({"success": False, "message": f"Invalid quantity unit. Must be one of: {', '.join(valid_units)}."}), 400
    quality_or_grade = (data.get("quality_or_grade") or "").strip() or None
    notes = (data.get("notes") or "").strip() or None
    new_record = HarvestRecord(user_id=farmer.farmer_id, crop_id=crop_id, harvest_date=harvest_date, quantity_harvested=quantity_harvested, quantity_unit=quantity_unit, quality_or_grade=quality_or_grade, notes=notes)
    try:
        db.session.add(new_record)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to record harvest. Please try again."}), 500
    return jsonify({"success": True, "message": "Harvest record saved successfully.", "record": new_record.to_dict()}), 201
@farm_diary_bp.route("/expenses", methods=["GET"])
@jwt_required()
def list_expenses():
    farmer, err = _get_current_farmer()
    if err:
        return err
    crop_id_filter = request.args.get("crop_id")
    category_filter = request.args.get("category")
    date_filter = request.args.get("date")
    query = FarmExpense.query.filter_by(user_id=farmer.farmer_id)
    if crop_id_filter:
        try:
            query = query.filter_by(crop_id=int(crop_id_filter))
        except (ValueError, TypeError):
            pass
    if category_filter:
        query = query.filter_by(expense_category=category_filter)
    if date_filter:
        from datetime import datetime
        try:
            date_val = datetime.strptime(date_filter, "%Y-%m-%d").date()
            query = query.filter(FarmExpense.expense_date == date_val)
        except (ValueError, TypeError):
            pass
    records = query.order_by(FarmExpense.expense_date.desc()).all()
    return jsonify({"success": True, "expenses": [r.to_dict() for r in records]}), 200


@farm_diary_bp.route("/expenses", methods=["POST"])
@jwt_required()
def add_expense():
    farmer, err = _get_current_farmer()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    expense_category = (data.get("expense_category") or "").strip()
    valid_categories = ["Seeds", "Fertilizers", "Pesticides", "Labour", "Irrigation", "Equipment", "Transportation", "Other"]
    if not expense_category or expense_category not in valid_categories:
        return jsonify({"success": False, "message": f"Invalid expense category. Must be one of: {', '.join(valid_categories)}."}), 400
    amount = data.get("amount")
    try:
        amount = float(amount) if amount and str(amount).strip() else None
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid amount."}), 400
    if amount is not None and amount <= 0:
        return jsonify({"success": False, "message": "Amount must be greater than zero."}), 400
    expense_date = data.get("expense_date")
    if not expense_date:
        return jsonify({"success": False, "message": "Expense date is required."}), 400
    try:
        from datetime import datetime
        expense_date = datetime.strptime(str(expense_date), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid expense date format. Use YYYY-MM-DD."}), 400
    crop_name = (data.get("crop_name") or "").strip()
    crop_id = None
    if crop_name:
        crop = FarmerCrop.query.filter_by(user_id=farmer.farmer_id, crop_name=crop_name).first()
        if crop:
            crop_id = crop.crop_id
    description = (data.get("description") or "").strip()
    if not description:
        return jsonify({"success": False, "message": "Description is required."}), 400
    new_expense = FarmExpense(user_id=farmer.farmer_id, crop_id=crop_id, expense_category=expense_category, amount=amount, expense_date=expense_date, description=description)
    try:
        db.session.add(new_expense)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to record expense. Please try again."}), 500
    return jsonify({"success": True, "message": "Expense recorded successfully.", "expense": new_expense.to_dict()}), 201