"""One-off script to create the first admin user. Run with: python -m app.seed_admin"""

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def main():
    email = input("Admin email: ").strip()
    full_name = input("Admin full name: ").strip()
    password = input("Admin password: ").strip()

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            print(f"User with email {email} already exists.")
            return
        user = User(email=email, full_name=full_name, password_hash=hash_password(password), role="ADMIN")
        db.add(user)
        db.commit()
        print(f"Admin user created: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
