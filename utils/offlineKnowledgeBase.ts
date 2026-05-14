
export interface OfflineQA {
  keywords: string[];
  response: string;
}

export const OFFLINE_KNOWLEDGE_BASE: OfflineQA[] = [
  {
    keywords: ["maize", "plant", "planting", "mahindi"],
    response: "For maize, the best time to plant is at the onset of rains. Ensure spacing of 75cm between rows and 25cm between plants. Use DAP fertilizer during planting and top-dress with CAN when the maize is knee-high."
  },
  {
    keywords: ["beans", "planting", "maharagwe"],
    response: "Beans should be planted in well-drained soil. Space them 45cm between rows and 15cm between plants. They are good for intercropping with maize as they fix nitrogen in the soil."
  },
  {
    keywords: ["potato", "blight", "disease", "viazi"],
    response: "Potato blight is common in wet weather. Use certified seeds and spray with fungicides like Ridomil or Mistress. Ensure you rotate crops and don't plant potatoes in the same field for consecutive seasons."
  },
  {
    keywords: ["tomato", "wilt", "pests", "nyanya"],
    response: "Tomatoes often suffer from bacterial wilt and pests like Tuta Absoluta. Use pheromone traps for Tuta and ensure your soil is well-drained to prevent wilt. Avoid overhead irrigation to reduce fungal diseases."
  },
  {
    keywords: ["fertilizer", "manure", "soil"],
    response: "Test your soil first. Generally, use DAP for planting to encourage root growth and CAN for top-dressing. Organic manure is excellent for improving soil structure and moisture retention."
  },
  {
    keywords: ["weather", "rain", "forecast"],
    response: "In offline mode, I cannot provide live weather updates. However, generally in Kenya, the long rains are from March to May and short rains from October to December. Check local radio for updates."
  },
  {
    keywords: ["chicken", "poultry", "kuku"],
    response: "Ensure your chicken house is well-ventilated and clean. Vaccinate against Newcastle and Gumboro diseases. High-quality feed and clean water are essential for good egg production and growth."
  },
  {
    keywords: ["cow", "milk", "cattle", "ng'ombe"],
    response: "For high milk yield, feed your cows with high-quality fodder like Napier grass, silage, and concentrates. Ensure they have constant access to clean water and mineral salt licks."
  }
];

export const getOfflineResponse = (query: string): string => {
  const normalizedQuery = query.toLowerCase();
  
  // Find the best match based on keyword count
  let bestMatch: OfflineQA | null = null;
  let maxKeywords = 0;

  for (const qa of OFFLINE_KNOWLEDGE_BASE) {
    let count = 0;
    for (const keyword of qa.keywords) {
      if (normalizedQuery.includes(keyword)) {
        count++;
      }
    }
    
    if (count > maxKeywords) {
      maxKeywords = count;
      bestMatch = qa;
    }
  }

  if (bestMatch && maxKeywords > 0) {
    return bestMatch.response;
  }

  return "I'm currently offline and don't have a specific answer for that. Please try asking about maize, beans, potatoes, tomatoes, or livestock, or reconnect to the internet for a full Gemini-powered response.";
};
