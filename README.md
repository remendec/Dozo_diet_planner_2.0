# Dôzo Diet Planner
Prototype infrastructure for personalized dietary decision-making

## General description
Dôzo Diet Planner is a functional software prototype focused on generating personalized healthy diets, designed as a platform for capturing, structuring, and analyzing individualized food demand.

The system uses the Harris-Benedict formula as its caloric calculation base (adjusted by activity level and weight objective), and collects personal and contextual user data in order to:
- Estimate daily energy requirements.
- Design menus compatible with medical restrictions.
- Adjust dietary proposals according to seasonality and geographic availability.
- Establish the foundation for progressive learning of tastes, preferences, and consumption patterns.
This version corresponds to a local prototype, focused on selected cities in Chile, and does not constitute a medical product nor replace professional evaluation by a nutritionist or physician.

## The problem Dôzo addresses
Dôzo is not limited to answering “what should a person eat”.
Its structural objective is to answer questions such as:
- What would a specific person eat, in a specific location, during a specific week, under specific constraints?

From this perspective, the project aims to build:
- A platform for individualized food demand capture
- A dietary decision-making infrastructure
- A system to reduce uncertainty in food production and planning

In the medium term, the system’s value lies not only in the generated menu, but in the database of active dietary profiles, including:
- Seasonal history
- Declared and revealed preferences
- Medical restrictions
- Repeatable consumption patterns by geographic area
Example of a future expected outcome:
“In this area, there are X thousand active dietary profiles with clear seasonal patterns and consistent preferences, enabling food demand forecasting with reduced uncertainty.”

## Technical foundations of the algorithm
1. Caloric calculation
Daily caloric requirements are estimated using the Harris-Benedict formula, adjusted for:
- Sex
- Age
- Weight
- Height
- Physical activity level
- Nutritional goal:
  - Weight loss
  - Maintenance
  - Weight gain
A minimum safety calorie threshold is enforced to prevent excessively restrictive diets.

2. Daily caloric distribution
Calories are distributed across meals within predefined ranges:
- Breakfast: 20–25%
- Lunch: 30–40%
- Dinner: 20–30%
- Snacks: 5–10%
- Flexible margin: 0–10%
The flexible margin allows for personal adjustments without breaking overall nutritional balance.

3. User data collected
The questionnaire includes:
Personal data
- Name
- Sex
- Age
- Weight
- Height
- Physical activity level
- Weight objective

Medical conditions (to avoid contraindications)
 - Diabetes
 - Celiac disease
 - High cholesterol
 - Lactose intolerance
 - Hypertension
 - Pregnancy
 - Food allergies (manually declared)
These conditions do not diagnose, they only exclude potentially problematic ingredients or food groups.

Dietary preferences:
- Regular diet
- Vegetarian diet
- Vegan diet

Geographic context
- City (currently limited to selected cities in Chile)
This information enables:
- Adjustment to locally available foods
- Incorporation of seasonality
- Future integration of pricing and local budget constraints

4. Seasonality and availability
The system automatically detects the season of the year, allowing it to:
- Prioritize seasonal fruits and vegetables
- Reduce dietary inconsistencies
- Prepare for future integration of pricing and logistics data

5. Architecture and projection
In the current version:
- The frontend captures and structures user input.
- The backend (local) generates coherent food combinations based on predefined rules.
- No API keys are exposed on the client side.
Future projections for Dôzo include:
- A mobile application (Android / iOS)
- Progressive preference-learning mechanisms
- Integration with:
  - Real pricing data
  - Budget constraints
  - Dynamic food substitutions
  - Regional food demand forecasting

Important disclaimer
This software is an experimental prototype.
It does not replace professional healthcare evaluation.
Dôzo does not prescribe medical treatments, it only proposes menus compatible with user-declared constraints.

## Usage instructions (local version)
Requirements
- Windows
- Node.js installed
- Modern web browser (Chrome, Edge, Firefox)

## Running the program
 1. Download or clone this repository to your computer.
 2. Ensure all files are located in the same folder.
 3. Locate the file:
    run_dozo_simple.bat
 4. Double-click the .bat file.
The system will:
- Start the local server.
- Automatically open the browser with the application running.
- No terminal usage or manual command execution is required.

## Basic usage
1. Complete the form with your personal data.
2. Select medical conditions and dietary preferences.
3. Choose the city and number of days.
4. Click “Generate Diet”.
5. Review the proposed daily menus with estimated calories per meal.

Project status
✔ Functional prototype
✔ Operational caloric algorithm
✔ Basic medical restrictions implemented
✔ Architecture prepared for scaling

Planned extensions:
- Mobile app
- Expanded food database
- Pricing and budget integration
- Preference learning
- Regional food demand forecasting
