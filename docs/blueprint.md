# **App Name**: eComm Central

## Core Features:

- Product Showcase: Display product listings with images, descriptions, and pricing. Store product data in a Firestore `products` collection. Each product should include fields such as `name`, `description`, `price`, `imageUrl`, and `category`. Allow filtering by category and display products in a responsive card layout.
- Shopping Cart: Enable users to add products to a shopping cart. Use `localStorage` or Firestore to save the cart data per user. Allow users to add and remove products, update quantities, and view totals. Automatically calculate totals with 16% VAT and a 30% profit margin. Ensure cart data persists between sessions.
- Checkout: Securely process payments via Stripe or PayPal. Integrate Stripe Checkout or PayPal Smart Buttons using Firebase Functions. After payment, update the order status in the `orders` collection in Firestore. Send confirmation emails with purchase details.
- User Accounts: Allow users to create accounts and manage their profiles. Use Firebase Authentication for email/password or Google login. Store user profiles in a `users` collection in Firestore with fields such as `uid`, `displayName`, `email`, `address`, and `orders`. Allow users to view their order history and update profile details.
- Product Search: Enable users to search for products. Implement keyword-based search using Firestore queries on the `products` collection. Optionally, integrate Algolia for more advanced and accurate search capabilities.
- Admin Dashboard: Provide a dashboard for users to manage products, categories, photos and descriptions. Restrict access to authorized admin users only. Include features to create, edit, and delete products. Manage categories in a separate `categories` collection. Upload and manage product images using Firebase Storage. View and process customer orders in the admin panel.
- AI Product Suggestions: Use an AI-powered tool to suggest similar or complementary products to the customer. Optionally integrate an AI service like OpenAI to analyze cart contents and recommend additional products. Example: If a customer adds a laptop, suggest a mouse, keyboard, or backpack.

## Style Guidelines:

- Primary color: Deep violet (#673AB7) for a sense of luxury and trust.
- Background color: Light gray (#F5F5F5) to keep the focus on the products.
- Accent color: A muted purple (#9575CD) will highlight certain sections.
- Clean and modern sans-serif fonts for product descriptions and titles.
- Simple and consistent icons for navigation and categories.
- Clean and well-spaced product grids for easy browsing.
- Subtle transition effects when hovering over products or adding to cart.