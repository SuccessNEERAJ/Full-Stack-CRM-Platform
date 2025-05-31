# Xeno CRM

![Xeno CRM](https://img.shields.io/badge/Xeno-CRM-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

A modern, AI-powered Customer Relationship Management system with advanced campaign management, intelligent customer segmentation, and real-time analytics.

## 🏗️ Architecture

The XENO CRM platform follows a modern, modular architecture designed for scalability and maintainability:

![Architectural Diagram](./Architectural%20Flowchart.png)

The architecture consists of three main tiers:
1. **Frontend Layer**: React-based UI with modular components
2. **Backend Layer**: Node.js/Express API server with RESTful endpoints
3. **Data & External Services Layer**: MongoDB database and Groq AI integration

## 🌟 Features

### 🔹 Customer Management
- Comprehensive customer profiles with detailed information
- Customer activity tracking and history
- Advanced search and filtering capabilities
- Customer tagging and categorization

### 🔹 Segmentation
- AI-powered segment creation using natural language
- Rule-based customer segmentation
- Dynamic segment updates based on customer behavior
- Real-time audience preview

### 🔹 Campaign Management
- Multi-channel campaign creation
- Campaign performance tracking and analytics
- Automated campaign scheduling
- A/B testing capabilities
- Modern UI with enhanced visual elements:
  - Key statistics dashboard cards (total campaigns, audience, success rate, segments)
  - Campaign avatars and visual identifiers
  - Colorized segment labels with chips
  - Interactive progress bars for success metrics
  - Intuitive icon-based action buttons
  - Helpful empty state guidance for new users
  - Improved delete confirmation with safety warnings

### 🔹 Analytics & Reporting
- Real-time dashboard with key performance indicators
- Campaign success metrics and delivery statistics
- Customer growth and engagement analytics
- Exportable reports and data visualization

### 🔹 Notifications System
- Real-time notifications for important events
- Customizable notification preferences
- Notification history and management

### 🔹 AI-Powered Features
- Natural language segment creation
- AI-generated messaging suggestions
- Intelligent campaign performance insights
- Automated customer behavior analysis
- Predictive campaign success modeling
- Content optimization recommendations
- Customer engagement predictions
- Churn risk identification
- Personalized communication suggestions

## 🛠️ Technology Stack

### Frontend
- **React.js**: Modern UI framework
- **Material-UI**: Component library for consistent design
- **Context API**: State management
- **Axios**: API communication
- **React Router**: Navigation and routing
- **React Toastify**: Notification system
- **Chart.js**: Data visualization
- **React Hook Form**: Form validation and handling
- **MUI X Data Grid**: Advanced data table functionality

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication
- **Groq AI**: Advanced AI capabilities

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Cloning the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/xeno-crm.git

# Navigate to the project directory
cd xeno-crm
```

## ⚙️ Environment Setup

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd xeno-crm-frontend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and fill in your actual values:
   ```
   # API Configuration
   REACT_APP_API_URL=http://localhost:5000
   
   # Application Configuration
   REACT_APP_NAME=Xeno CRM
   
   # Authentication
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
   REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   
   # AI Services
   REACT_APP_GROQ_API_KEY=your_groq_api_key_here
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd xeno-crm-backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and fill in your actual values:
   ```
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/xeno-crm
   DB_NAME=xeno-crm
   
   # JWT Authentication
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=1d
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   
   # Email Service (if applicable)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password_here
   EMAIL_FROM=your_email@gmail.com
   
   # AI Services - Groq API Keys
   GROQ_API_KEY_SEGMENT_RULES=your_segment_rules_groq_api_key_here
   GROQ_API_KEY_MESSAGE_SUGGESTIONS=your_message_suggestions_groq_api_key_here
   GROQ_API_KEY_CAMPAIGN_SUMMARY=your_campaign_summary_groq_api_key_here
   ```

## 📦 Installation & Running

### Frontend

```bash
# Navigate to frontend directory
cd xeno-crm-frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will be available at `http://localhost:3000`

### Development Build

```bash
# Build for production
npm run build

# Run the production build locally
serve -s build
```

### Backend

```bash
# Navigate to backend directory
cd xeno-crm-backend

# Install dependencies
npm install

# Start development server
npm start
```

The API will be available at `http://localhost:5000`

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Complete password reset

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Segments
- `GET /api/segments` - Get all segments
- `GET /api/segments/:id` - Get segment by ID
- `GET /api/segments/:id/audience` - Get segment audience
- `POST /api/segments` - Create new segment
- `POST /api/segments/preview` - Preview segment audience
- `PUT /api/segments/:id` - Update segment
- `DELETE /api/segments/:id` - Delete segment

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/stats` - Get campaign statistics
- `GET /api/campaigns/:id/analytics` - Get detailed campaign analytics
- `POST /api/campaigns/:id/duplicate` - Duplicate existing campaign
- `PUT /api/campaigns/:id/status` - Update campaign status

## 🧠 AI Integration

Xeno CRM leverages Groq's powerful AI capabilities for several key features:

### 1. Natural Language Segment Creation
Users can describe their target audience in plain English, and the AI will convert it into segment rules.

Example: "Customers who spent more than 10000 AND their visits count is less than 3" gets converted to appropriate database queries.

### 2. Campaign Message Suggestions
AI generates personalized message templates based on campaign goals and target audience.

### 3. Performance Insights
AI analyzes campaign performance and provides actionable insights to improve future campaigns.

### 4. Customer Behavior Analysis
AI identifies patterns and trends in customer behavior to inform segmentation strategies.

### 5. Content Optimization
AI provides recommendations for optimizing campaign content based on historical performance data.

### 6. Predictive Analytics
AI forecasts campaign performance and customer engagement metrics to guide marketing strategy.

## 🔒 Security

- **JWT Authentication**: Secure user authentication
- **Environment Variables**: All sensitive information stored in .env files
- **API Key Protection**: Groq API keys and other credentials secured
- **Input Validation**: Protection against malicious inputs
- **CORS Configuration**: Controlled access to API endpoints

## ⚠️ Known Limitations & Assumptions

### Browser Compatibility
- Optimized for modern browsers (Chrome, Firefox, Safari, Edge)
- Limited support for Internet Explorer 11 and below
- Not fully responsive; optimized for desktop and tablet views (minimum 768px width)

### AI Integration
- Groq API has rate limits that may affect heavy usage scenarios
- AI predictions are probabilistic and not guaranteed to be 100% accurate
- Large language model responses may occasionally contain irrelevant suggestions

### Performance
- System is designed for up to 100,000 customers and 10,000 campaigns
- Dashboard performance may degrade with extremely large datasets
- Recommended maximum file upload size: 10MB

### Data & Privacy
- User data is stored according to the privacy policy and local regulations
- Assumes compliance with GDPR, CCPA, and similar regulations for user implementations
- No built-in data residency controls for specific geographic requirements

### Connectivity
- Requires stable internet connection for AI features
- Offline functionality is limited to basic viewing of cached data

### Localization
- Primary language support for English
- Limited localization for other languages
- Date formats default to MM/DD/YYYY unless configured otherwise

## 🧪 Testing

```bash
# Run frontend tests
cd xeno-crm-frontend
npm test

# Run backend tests
cd xeno-crm-backend
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- Your Name - *Lead Developer* - [GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgements

- [Material-UI](https://mui.com/) for the UI components
- [Groq AI](https://groq.com/) for AI capabilities
- [MongoDB](https://www.mongodb.com/) for database services
- [React](https://reactjs.org/) for the frontend framework
