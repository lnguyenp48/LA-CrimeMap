# LA Crime Statistical Rates over Time

## Our Project

This project is an interactive data visualization that allows users to explore the patterns of criminal activity across the Los Angeles area. The goal of the project is to help users answer meaningful questions that could lead to greater insights regarding crime in LA, such as:
- Which type of crimes are the most prevalent?
- When and where do crimes most frequently occur?
- What types of similarities victims may have?

To answer these questions, we used the dataset provided by the City of Los Angeles, which can be found on [data.gov](https://catalog.data.gov/dataset/crime-data-from-2020-to-present), and the dataset provides important attributes such as victim demographics, the time and location of the crime, status of investigation, whether people were arrested, and much more.

The main feature of the visualization is the heatmap displaying various districts of Los Angeles that allows us to condense a large quantity of important data into a format that is easily digestible for the user to access and draw insights from. In addition to the heatmap, we included the following features to allow for greater data interpretation:
- Timeline that allows for dynamic data filtering through brushing
- Clickable district nodes that shows crime data regarding the district through bar charts
- Different map views based on selected victim or crime attributes

We believe that this visualization and the data it presents could be applied by having it used in checking which areas have consistently high crime rates, which can help city officials decide where to invest money for development or crime prevention. It may also allow civilians to get an idea of which areas they want to avoid if they worry about their own safety. 

## Installation Guide

To install the files needed to run the visualizations, start by cloning the repository to your local machine:

```bash
git clone https://github.com/lnguyenp48/LA-CrimeMap.git
cd LA-CrimeMap (or your own path to cloned repository)
```


## How to Run

We recommend running this through the [Live Server Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) through Visual Studio Code. Otherwise, you may use Python 3 to start your own live server
```bash
python3 -m http.server 8000
```
After successfully starting the local server, type the following link into your browser:
```
http://localhost:8000/index.html
```

You should now be able to access and interact with the crime map!