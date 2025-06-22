# RedDoor Test Plan

## Test Credentials

- **Email**: john@johncorser.com
- **Password**: j3rK4l3rt!

## Complete User Flow Test

### 1. Landing → Create City → Create Channel → Create Post

**Step 1: Landing Page**

- Visit homepage
- See "Welcome to RedDoor"
- Click "Create New City"

**Step 2: Create City**

- Fill form: City="Test City", State="California"
- Submit → Creates city via API
- Navigate to city view

**Step 3: Create Channel**

- Click "Create Channel"
- Fill form: Name="general", Description="General discussion"
- Submit → Creates channel via API
- Navigate to channel view

**Step 4: Create Post**

- Click "Create Post in #general"
- Fill form: Title="Welcome!", Content="Hello everyone!"
- Submit → Creates post via API
- View post in channel

## Guest Experience

- Can view all content (cities, channels, posts)
- Create buttons disabled with "Sign in" messages
- Cannot add comments without authentication

## Running Tests

```bash
npm run test:run  # Automated tests
npm run dev      # Manual testing at localhost:5173
```

## Expected Results

✅ Complete flow works end-to-end  
✅ Authentication gates create operations  
✅ Guests can view all content  
✅ All API integrations functional
