// services/colorService.js
import axios from 'axios'

export const getClosestColorInfo = async (color) => {
    let url = `${this.$config.public.apiBaseURL}/analyze}/closest_color_lab`;
    url += color.r ? `?r=${color.r}&g=${color.g}&b=${color.b}` : `?hex=${color.html_code.substring(1)}`;
    const response = await axios.get(url)
    return response.data
};

// Add more color-related functions as needed
export const euclideanDistance = (lab1, lab2) => {
    return Math.sqrt(
        Math.pow(lab1.l - lab2.l, 2) +
        Math.pow(lab1.a - lab2.a, 2) +
        Math.pow(lab1.b - lab2.b, 2)
    )
}