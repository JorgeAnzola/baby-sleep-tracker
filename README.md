# 🍼 Baby Sleep Tracker (NapGenius)

A modern and intuitive web application for tracking your baby's sleep patterns with intelligent NapGenius predictions, multi-user authentication system, and Home Assistant integration for home automation.

![Baby Sleep Tracker](./docs/hero-image.png)

## ✨ Key Features

### 👤 User System

- **Registration & Login**: Complete authentication system
- **Secure sessions**: JWT tokens with httpOnly cookies
- **Multi-baby**: Each user can manage multiple babies
- **Privacy**: Data completely isolated per user

### 🌙 Sleep Tracking

- **Intuitive timer**: Start and stop sleep sessions with one touch
- **Time editing**: Adjust start time during active session with one click
- **Editable history**: Modify past sessions (start, end, quality)
- **Sleep types**: Differentiate between naps and nighttime sleep
- **Detailed logging**: Sleep quality, location, and notes
- **Data import**: Import your complete history from Huckleberry in CSV format

### 🔮 NapGenius Predictions

- Algorithm based on age and historical patterns
- **Bedtime**: Intelligent calculation of optimal bedtime
- **Wake windows**: Personalized recommendations by age
- **Confidence**: Precision indicators for predictions

### 🏠 Home Assistant Integration

- **Complete REST API**: Endpoints for automation
- **Real-time states**: Awake, sleeping, sleepy soon
- **Webhooks**: State change notifications
- **Compatible**: Easy integration with existing automations

### 📱 Mobile-First Design

- **Elegant interface**: Modern UI inspired by Huckleberry
- **Responsive**: Optimized for mobile and tablets
- **Adaptive theme**: Dark mode support
- **Intuitive gestures**: Natural and fluid navigation

## 🚀 Quick Start

### Option 1: Automatic Installation (1 Command) 🎯

The fastest way - **fully automatic in 60 seconds**:

```bash
curl -fsSL https://raw.githubusercontent.com/jorgeanzola/baby-sleep-tracker/main/install.sh | bash
```

This script automatically:

- ✅ Verifies Docker
- ✅ Downloads configuration files
- ✅ Generates secure secrets
- ✅ Starts PostgreSQL + App
- ✅ Opens in your browser

**Done!** Access at [http://localhost:3000](http://localhost:3000)

---

### Option 2: Docker Hub Manual (3 Steps) 🐳

If you prefer manual control:

```bash
# 1. Download files
mkdir napgenius && cd napgenius
curl -O https://raw.githubusercontent.com/jorgeanzola/baby-sleep-tracker/main/docker-compose.public.yml
mv docker-compose.public.yml docker-compose.yml
curl -O https://raw.githubusercontent.com/jorgeanzola/baby-sleep-tracker/main/.env.public.example
mv .env.public.example .env

# 2. Configure .env (change passwords and secrets)
nano .env

# 3. Start
docker-compose up -d
```

Application will be available at [http://localhost:3000](http://localhost:3000)

📖 **[See complete installation guide with Docker Hub](./DOCKER_QUICK_START.md)**

---

### Option 3: Docker from Source Code 🛠️

For development or contributions:

```bash
# Clone repository
git clone https://github.com/jorgeanzola/baby-sleep-tracker.git
cd baby-sleep-tracker

# Configure environment variables
cp .env.example .env
# Edit .env with your secure values

# Start with Docker Compose
docker-compose up -d
```

### Option 4: Manual Installation

For environments without Docker:

#### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- npm or yarn

#### Installation

1. **Clone the repository**

```bash
git clone https://github.com/jorgeanzola/baby-sleep-tracker.git
cd baby-sleep-tracker
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure PostgreSQL**

Create a PostgreSQL database and configure your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/napgenius?schema=public"
JWT_SECRET="your_very_secure_secret_key_here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Set up the database**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Start development server**

```bash
npm run dev
```

6. **Open the application**

   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Register with your email and password
   - Create your baby's profile and start tracking

## 📝 Usage Guide

### First Use

1. **Register**: Create an account with your email and password (minimum 8 characters)
2. **Create baby**: Add your baby's name and birth date
3. **Start sleep**: Tap "Start Nap" or "Start Night Sleep"
4. **During sleep**: Timer runs automatically
5. **Close session**: Use logout button in settings menu

### 🔐 Session Management

**During active session:**

- Tap the edit icon (✏️) next to "Sleeping since"
- Adjust start time if you forgot to start the timer on time
- Calculations update automatically

**Past sessions:**

- In history, tap edit icon on any session
- Modify start time, end time, quality, or notes
- Ideal for correcting errors or adding details later

### 📥 Import from Huckleberry

**Migrate your data easily:**

1. Go to Settings (⚙️) in the top right corner
2. In the "Data Management" section, click "Import CSV"
3. Select your CSV file exported from Huckleberry
4. Review import statistics
5. Done! Your historical data now powers NapGenius predictions

**Import features:**

- ✅ Automatic sleep type detection (nap vs nighttime)
- ✅ Intelligent record deduplication
- ✅ Detailed statistics (imported, skipped, errors)
- ✅ Automatic prediction updates with your complete history
- ✅ Local and secure data processing

## 🛠 Technologies

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16
- **Authentication**: JWT with jose, bcryptjs
- **State**: Zustand with persistence
- **UI**: Shadcn/ui components
- **Icons**: Lucide React
- **Deployment**: Docker & Docker Compose

## 📊 API for Home Assistant

### Get Current Status

```bash
GET /api/sleep-status?babyId=your-baby-id
```

**Response:**

```json
{
  "baby": {
    "id": "...",
    "name": "...",
    "age_in_days": 400
  },
  "current_state": {
    "sleep_state": "awake|sleeping|sleepy_soon|bedtime_soon",
    "time_until_next_sleep": 45,
    "current_sleep_duration": null,
    "is_nap_time": false,
    "is_bedtime": false
  },
  "predictions": {
    "next_nap": {
      "predicted_time": "2024-01-15T14:30:00Z",
      "confidence": 0.85,
      "predicted_duration": 90,
      "reasoning": "Based on 120min awake (expected: 120min) - Nap 1/2"
    },
    "bedtime": {
      "predicted_time": "2024-01-15T19:00:00Z",
      "confidence": 0.9,
      "reasoning": "Typical bedtime for age: 19:00"
    }
  }
}
```

### Start Sleep Session

```bash
POST /api/sleep-session
Content-Type: application/json

{
  "baby_id": "your-baby-id",
  "sleep_type": "NAP",
  "location": "crib",
  "notes": "Fell asleep easily"
}
```

### End Sleep Session

```bash
PUT /api/sleep-session
Content-Type: application/json

{
  "baby_id": "your-baby-id",
  "quality": "GOOD",
  "notes": "Woke up happy"
}
```

### Edit Start Time (Active Session)

```bash
PATCH /api/sleep-session/edit-start-time
Content-Type: application/json

{
  "baby_id": "your-baby-id",
  "new_start_time": "2024-01-15T13:30:00Z"
}
```

### Edit Completed Session

```bash
PATCH /api/sleep-session/{session-id}
Content-Type: application/json

{
  "start_time": "2024-01-15T13:30:00Z",
  "end_time": "2024-01-15T15:00:00Z",
  "quality": "EXCELLENT",
  "notes": "Perfect nap!"
}
```

## 🏠 Home Assistant Configuration

### Status Sensor

```yaml
# configuration.yaml
sensor:
  - platform: rest
    name: "Baby Sleep Status"
    resource: "http://your-app-url/api/sleep-status?babyId=your-baby-id"
    method: GET
    value_template: "{{ value_json.current_state.sleep_state }}"
    json_attributes:
      - baby
      - current_state
      - predictions
    scan_interval: 60
```

### Example Automation

```yaml
# automations.yaml
- alias: "Baby Sleep Mode"
  trigger:
    - platform: state
      entity_id: sensor.baby_sleep_status
      to: "sleeping"
  action:
    - service: light.turn_off
      target:
        entity_id: light.nursery_lights
    - service: climate.set_temperature
      target:
        entity_id: climate.nursery
      data:
        temperature: 20

- alias: "Baby Wake Up Soon"
  trigger:
    - platform: state
      entity_id: sensor.baby_sleep_status
      to: "sleepy_soon"
  action:
    - service: notify.mobile_app
      data:
        title: "NapGenius Alert"
        message: "{{ states.sensor.baby_sleep_status.attributes.baby.name }} should nap in {{ states.sensor.baby_sleep_status.attributes.current_state.time_until_next_sleep }} minutes"
```

## 🎯 NapGenius Algorithm

The prediction algorithm is based on:

1. **Age patterns**: Data from infant sleep research
2. **Personal history**: Analysis of individual patterns
3. **Wake windows**: Optimal awake time by age
4. **Temporal context**: Time of day and number of naps
5. **Sleep quality**: Adjustments based on previous nap quality

### Age Patterns

- **0-3 months**: 4 naps, 45-120min windows
- **3-6 months**: 3 naps, 120-210min windows
- **6-12 months**: 2 naps, 180-270min windows
- **12+ months**: 1 nap, 300-360min windows

## 🚀 Development

### Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── globals.css    # Global styles
│   └── page.tsx       # Main page
├── components/
│   ├── ui/            # Shadcn/ui base components
│   ├── SleepTimer.tsx # Main timer
│   └── SleepPredictions.tsx # Predictions
├── lib/
│   ├── store.ts       # Zustand global state
│   ├── sleep-predictions.ts # Prediction algorithms
│   └── utils.ts       # Utilities
└── prisma/
    └── schema.prisma  # Database schema
```

### Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Linting
npm run type-check   # Type checking
```

### Database

```bash
npx prisma studio    # Visual data explorer
npx prisma migrate dev # New migration
npx prisma db push   # Sync changes without migration
```

## 🤝 Contributing

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add: amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Roadmap

- [ ] Sleep pattern charts
- [ ] Data export
- [ ] Multiple babies
- [ ] Push notifications
- [ ] Native mobile app
- [ ] Wearable integration
- [ ] Improved machine learning

## ⚠️ Important Notes

### Daylight Saving Time (DST)

When a daylight saving time change occurs, predictions may show a temporal difference of **±1 hour** for 3-7 days. This is normal because:

- 📊 The system learns from historical patterns (in previous timezone)
- 🔄 Predictions will auto-adjust automatically
- ⏰ After 5-7 days, predictions will reflect the new time
- ✅ No manual action required, the system adapts on its own

**Example**: If NapGenius predicted wake-up at 7:14 and baby woke at 6:14, it was due to time change. In a few days, predictions will be accurate again with the new time.

### Prediction Accuracy

- **High confidence (>80%)**: Based on 10+ similar sessions
- **Medium confidence (60-80%)**: Based on 5-10 sessions
- **Low confidence (<60%)**: Based on general age patterns

Predictions improve over time as you record more sleep sessions.

## 📄 License

This project is under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the Huckleberry app
- Sleep patterns based on pediatric research
- UI design inspired by mobile-first best practices

---

**Have questions?** Open an [issue](https://github.com/jorgeanzola/baby-sleep-tracker/issues) or contact the development team.
