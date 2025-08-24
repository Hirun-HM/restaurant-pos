# Restaurant POS System

A modern, responsive Point of Sale (POS) system built with React and TypeScript, designed specifically for restaurant operations.

## Features

- **Dashboard**: Real-time overview of orders, revenue, and restaurant metrics
- **Menu Management**: Add, edit, and manage menu items with categories
- **Order Tracking**: Track orders from placement to completion with status updates
- **Responsive Design**: Works seamlessly on tablets, desktops, and mobile devices
- **Modern UI**: Clean, intuitive interface designed for restaurant staff

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: CSS Modules with modern CSS features
- **Development**: ESLint for code quality

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd restaurant-pos
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Navigation header
│   └── Header.css      # Header styles
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Dashboard overview
│   ├── Menu.tsx        # Menu management
│   ├── Orders.tsx      # Order tracking
│   └── *.css           # Page-specific styles
├── App.tsx             # Main application component
├── App.css             # Global application styles
├── main.tsx            # Application entry point
└── index.css           # Global base styles
```

## Features Overview

### Dashboard
- Today's orders count and revenue
- Active orders monitoring
- Quick action buttons for common tasks
- Visual statistics cards

### Menu Management
- Category-based filtering
- Add new menu items
- Toggle item availability
- Price management

### Order Management
- Real-time order tracking
- Status-based filtering (Pending, Preparing, Ready, Served)
- Order details with items and pricing
- One-click status updates

## Development

The project uses modern React patterns and TypeScript for type safety. Each component is self-contained with its own styles and follows React best practices.

### Code Style
- Functional components with hooks
- TypeScript interfaces for type definitions
- CSS Modules for component styling
- Responsive design principles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
