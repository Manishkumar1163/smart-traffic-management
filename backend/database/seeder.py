import asyncio
import logging
from datetime import datetime, timedelta
from backend.database.connection import db
from backend.utils.security import hash_password

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("seeder")

async def seed_database():
    log.info("🌱 Seeding database...")

    # 1. Seed Users (Roles)
    users_to_seed = [
        {
            "name": "System Administrator",
            "email": "admin@traffic.com",
            "password": hash_password("admin123"),
            "role": "admin"
        },
        {
            "name": "Traffic Officer John",
            "email": "officer@traffic.com",
            "password": hash_password("officer123"),
            "role": "traffic_officer"
        },
        {
            "name": "Public Viewer Account",
            "email": "viewer@traffic.com",
            "password": hash_password("viewer123"),
            "role": "viewer"
        }
    ]

    for user in users_to_seed:
        existing = await db.users.find_one({"email": user["email"]})
        if not existing:
            await db.users.insert_one(user)
            log.info(f"Created user: {user['email']} ({user['role']})")

    # 2. Seed Drivers & Vehicles mapping
    # These match potential detected plates in videos or test scripts
    drivers_to_seed = [
        {
            "name": "Ramesh Kumar",
            "email": "ramesh@example.com",
            "phone": "9876543210",
            "license_number": "DL-1420180098765",
            "license_plate": "MH12AB1234",
            "address": "Flat 402, Shivajinagar, Pune, Maharashtra - 411005",
            "rc_number": "RC-MH12AB1234",
            "insurance_number": "INS-998877",
            "insurance_expiry": (datetime.now() + timedelta(days=200)).isoformat(),
            "photo": "",
            "created_at": datetime.now().isoformat()
        },
        {
            "name": "Ananya Sharma",
            "email": "ananya@example.com",
            "phone": "8765432109",
            "license_number": "DL-0420200054321",
            "license_plate": "DL3CAQ9876",
            "address": "Sector 15, Dwarka, New Delhi - 110075",
            "rc_number": "RC-DL3CAQ9876",
            "insurance_number": "INS-112233",
            "insurance_expiry": (datetime.now() + timedelta(days=120)).isoformat(),
            "photo": "",
            "created_at": datetime.now().isoformat()
        },
        {
            "name": "Vikram Singh",
            "email": "vikram@example.com",
            "phone": "7654321098",
            "license_number": "DL-1220150012345",
            "license_plate": "KA03MM4567",
            "address": "Koramangala 4th Block, Bengaluru, Karnataka - 560034",
            "rc_number": "RC-KA03MM4567",
            "insurance_number": "INS-445566",
            "insurance_expiry": (datetime.now() - timedelta(days=15)).isoformat(),  # Expired insurance!
            "photo": "",
            "created_at": datetime.now().isoformat()
        },
        {
            "name": "Priya Patel",
            "email": "priya@example.com",
            "phone": "9998887776",
            "license_number": "DL-0520190088888",
            "license_plate": "GJ01XY7890",
            "address": "Satellite Road, Ahmedabad, Gujarat - 380015",
            "rc_number": "RC-GJ01XY7890",
            "insurance_number": "INS-778899",
            "insurance_expiry": (datetime.now() + timedelta(days=300)).isoformat(),
            "photo": "",
            "created_at": datetime.now().isoformat()
        }
    ]

    for driver in drivers_to_seed:
        existing = await db.drivers.find_one({"license_plate": driver["license_plate"]})
        if not existing:
            await db.drivers.insert_one(driver)
            log.info(f"Registered driver for vehicle: {driver['license_plate']}")

    log.info("✅ Seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())
