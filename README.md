<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0ee9ec94-122b-41b7-95da-2ae86415791d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# End Meal Decision Fatigue

A product-focused application designed to reduce the cognitive load of deciding what to eat by providing fast, personalized meal recommendations.

---

## Overview

Daily food selection is a repetitive decision that often leads to time loss, indecision, and suboptimal choices. This project addresses that problem by introducing a lightweight decision layer that simplifies meal selection based on user preferences and context.

---

## Problem Statement

Users frequently experience:

* Decision fatigue from repeated meal choices
* Excessive time spent browsing options
* Overwhelm due to too many choices
* Reduced engagement with food platforms due to friction in decision-making

---

## Solution

End Meal Decision Fatigue provides a streamlined recommendation experience that:

* Reduces the number of choices presented
* Adapts to user preferences over time
* Enables quick and confident decision-making

---

## Core Features

### Quick Picks

Provides instant meal suggestions to minimize decision time.

### Personalized Recommendations

Adapts suggestions based on user behavior, preferences, and historical choices.

### Context-Aware Suggestions

Generates recommendations based on time of day, user intent, and effort level.

### Simplified Decision Engine

Limits options to a small set of high-confidence recommendations to reduce cognitive load.

---

## Product Perspective

### User Problems Addressed

* Cognitive overload in daily decisions
* Inefficient browsing behavior
* Lack of relevant personalization

### Expected Impact

* Increase in daily active usage
* Improvement in conversion rates
* Reduction in drop-off during selection
* Higher user retention over time

---

## Technology Stack

* Frontend: React
* Backend: Node.js (extensible)
* Data Layer: User preference modeling
* Analytics: Event tracking tools such as Mixpanel

---

## Metrics and Evaluation

* Time taken to make a decision
* Drop-off rate during selection
* Daily active users
* Recommendation click-through rate
* Repeat usage frequency

---

## Future Enhancements

* Machine learning-based recommendation engine
* Integration with food delivery platforms
* Nutrition-aware filtering
* Voice-based interaction
* Collaborative meal planning

---

## Installation and Setup

```bash
# Clone the repository
git clone https://github.com/rvsvaishnavi3122/End-Meal-Decision-Fatigue.git

# Navigate to the project directory
cd End-Meal-Decision-Fatigue

# Install dependencies
npm install

# Run the application
npm start
```

---

## Vision

To serve as a decision layer for everyday food choices, enabling users to make faster and more consistent meal decisions with minimal effort.

---

## Contributing

Contributions are welcome. Please fork the repository and submit a pull request with a clear description of changes.

---

## License

This project is licensed under the MIT License.

---

## Author

Vaishnavi RVS

Aspiring Product Manager focused on building user-centric solutions.
