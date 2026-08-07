"use client";

import type { DragEvent as ReactDragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type LiveCountry = {
  name: string;
  code: string;
  score: number;
  momentum: number;
  movedBy: string;
  reasons: string[];
};

const initialCountries: LiveCountry[] = [
  { name: "Denmark", code: "dk", score: 98, momentum: 12, movedBy: "Tactical votes", reasons: ["Team play", "CS depth", "IGL culture"] },
  { name: "South Korea", code: "kr", score: 97, momentum: 10, movedBy: "MOBA voters", reasons: ["Academies", "Practice", "Discipline"] },
  { name: "China", code: "cn", score: 95, momentum: 7, movedBy: "Scale voters", reasons: ["Player base", "Investment", "Mechanics"] },
  { name: "USA", code: "us", score: 94, momentum: 9, movedBy: "Fortnite voters", reasons: ["Creators", "Talent pool", "Events"] },
  { name: "Brazil", code: "br", score: 93, momentum: 14, movedBy: "FPS voters", reasons: ["Aggression", "Aim", "Fan energy"] },
  { name: "France", code: "fr", score: 92, momentum: 6, movedBy: "Rocket League voters", reasons: ["Aerial play", "Technical depth", "Clubs"] },
  { name: "Sweden", code: "se", score: 91, momentum: -2, movedBy: "Legacy voters", reasons: ["CS history", "LAN culture", "AWPers"] },
  { name: "Germany", code: "de", score: 90, momentum: 3, movedBy: "Structure voters", reasons: ["Organisation", "Sports titles", "Stable scene"] },
  { name: "Japan", code: "jp", score: 89, momentum: 5, movedBy: "Fighting game voters", reasons: ["Precision", "Arcade roots", "Patience"] },
  { name: "United Kingdom", code: "gb", score: 88, momentum: 4, movedBy: "Hybrid voters", reasons: ["Adaptability", "Rocket League", "FPS support"] },
  { name: "Canada", code: "ca", score: 87, momentum: 8, movedBy: "Valorant voters", reasons: ["Composure", "FPS skill", "NA scene"] },
  { name: "Australia", code: "au", score: 86, momentum: 4, movedBy: "OCE voters", reasons: ["Resilience", "FPS grit", "Distance fighter"] },
  { name: "Netherlands", code: "nl", score: 85, momentum: 5, movedBy: "Rocket League voters", reasons: ["Precision", "Small-scene depth", "Tactics"] },
  { name: "India", code: "in", score: 84, momentum: 8, movedBy: "Mobile voters", reasons: ["Audience scale", "Mobile growth", "Young scene"] },
  { name: "Turkey", code: "tr", score: 83, momentum: 5, movedBy: "Valorant voters", reasons: ["Raw aim", "Fans", "FPS culture"] },
  { name: "Finland", code: "fi", score: 82, momentum: -1, movedBy: "Aim voters", reasons: ["Composure", "FPS legacy", "Snipers"] },
  { name: "Poland", code: "pl", score: 81, momentum: 2, movedBy: "CS voters", reasons: ["CS history", "Grind culture", "Local scene"] },
  { name: "Spain", code: "es", score: 80, momentum: 4, movedBy: "Momentum voters", reasons: ["Valorant growth", "Audience", "Energy"] },
  { name: "South Africa", code: "za", score: 78, momentum: 6, movedBy: "Regional voters", reasons: ["Leadership", "Resilience", "Community drive"] },
  { name: "Mexico", code: "mx", score: 77, momentum: 4, movedBy: "Fighting game voters", reasons: ["Fan intensity", "Local events", "Rivalry"] },
  { name: "Saudi Arabia", code: "sa", score: 76, momentum: 7, movedBy: "Investment voters", reasons: ["Events", "Rocket League", "Rapid growth"] },
  { name: "Argentina", code: "ar", score: 75, momentum: 2, movedBy: "Sports voters", reasons: ["Football mindset", "Passion", "Tactical instinct"] },
  { name: "New Zealand", code: "nz", score: 73, momentum: 1, movedBy: "OCE voters", reasons: ["Adaptability", "Creativity", "Regional pride"] },
  { name: "Nigeria", code: "ng", score: 72, momentum: 9, movedBy: "Future voters", reasons: ["Youth", "Mobile growth", "Cultural energy"] },
  { name: "Afghanistan", code: "af", score: 71, momentum: -5, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Albania", code: "al", score: 71, momentum: -1, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Algeria", code: "dz", score: 71, momentum: 3, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "American Samoa", code: "as", score: 71, momentum: 7, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Andorra", code: "ad", score: 71, momentum: 8, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Angola", code: "ao", score: 71, momentum: -3, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Anguilla", code: "ai", score: 70, momentum: -5, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Antarctica", code: "aq", score: 70, momentum: 5, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Antigua and Barbuda", code: "ag", score: 70, momentum: 6, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Armenia", code: "am", score: 70, momentum: -5, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Aruba", code: "aw", score: 70, momentum: -4, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Austria", code: "at", score: 70, momentum: 3, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Azerbaijan", code: "az", score: 69, momentum: 7, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Bahamas", code: "bs", score: 69, momentum: 9, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Bahrain", code: "bh", score: 69, momentum: 7, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Bangladesh", code: "bd", score: 69, momentum: -4, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Barbados", code: "bb", score: 69, momentum: 6, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Belarus", code: "by", score: 69, momentum: 1, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Belgium", code: "be", score: 68, momentum: 2, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Belize", code: "bz", score: 68, momentum: 6, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Benin", code: "bj", score: 68, momentum: 4, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Bermuda", code: "bm", score: 68, momentum: -1, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Bhutan", code: "bt", score: 68, momentum: 6, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Bolivia", code: "bo", score: 68, momentum: 7, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Bosnia and Herzegovina", code: "ba", score: 67, momentum: -4, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Botswana", code: "bw", score: 67, momentum: 3, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Bouvet Island", code: "bv", score: 67, momentum: 1, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "British Indian Ocean Territory", code: "io", score: 67, momentum: 0, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "British Virgin Islands", code: "vg", score: 67, momentum: 8, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Brunei", code: "bn", score: 67, momentum: -5, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Bulgaria", code: "bg", score: 66, momentum: 5, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Burkina Faso", code: "bf", score: 66, momentum: 3, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Burundi", code: "bi", score: 66, momentum: -2, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Cabo Verde", code: "cv", score: 66, momentum: 0, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Cambodia", code: "kh", score: 66, momentum: 0, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Cameroon", code: "cm", score: 66, momentum: 5, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Caribbean Netherlands", code: "bq", score: 65, momentum: -4, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Cayman Islands", code: "ky", score: 65, momentum: 9, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Central African Republic", code: "cf", score: 65, momentum: 2, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Chad", code: "td", score: 65, momentum: -4, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Chile", code: "cl", score: 65, momentum: 7, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Christmas Island", code: "cx", score: 65, momentum: -1, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Cocos Islands", code: "cc", score: 64, momentum: -3, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Colombia", code: "co", score: 64, momentum: 4, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Comoros", code: "km", score: 64, momentum: -5, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Cook Islands", code: "ck", score: 64, momentum: 9, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Costa Rica", code: "cr", score: 64, momentum: 1, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Croatia", code: "hr", score: 64, momentum: 7, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Cuba", code: "cu", score: 63, momentum: -3, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Curaçao", code: "cw", score: 63, momentum: 4, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Cyprus", code: "cy", score: 63, momentum: -4, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Czechia", code: "cz", score: 63, momentum: 0, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Côte d’Ivoire", code: "ci", score: 63, momentum: -5, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Djibouti", code: "dj", score: 62, momentum: 6, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Dominica", code: "dm", score: 62, momentum: 1, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Dominican Republic", code: "do", score: 62, momentum: 8, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "DR Congo", code: "cd", score: 62, momentum: -1, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Ecuador", code: "ec", score: 62, momentum: -4, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Egypt", code: "eg", score: 62, momentum: 9, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "El Salvador", code: "sv", score: 61, momentum: 3, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Equatorial Guinea", code: "gq", score: 61, momentum: -5, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Eritrea", code: "er", score: 61, momentum: 0, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Estonia", code: "ee", score: 61, momentum: 7, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Eswatini", code: "sz", score: 61, momentum: 4, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Ethiopia", code: "et", score: 61, momentum: 9, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Falkland Islands", code: "fk", score: 60, momentum: 5, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Faroe Islands", code: "fo", score: 60, momentum: 3, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Fiji", code: "fj", score: 60, momentum: 4, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "French Guiana", code: "gf", score: 60, momentum: 0, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "French Polynesia", code: "pf", score: 60, momentum: 4, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "French Southern Territories", code: "tf", score: 60, momentum: 3, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Gabon", code: "ga", score: 59, momentum: 3, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Gambia", code: "gm", score: 59, momentum: -5, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Georgia", code: "ge", score: 59, momentum: 2, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Ghana", code: "gh", score: 59, momentum: -3, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Gibraltar", code: "gi", score: 59, momentum: 1, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Greece", code: "gr", score: 59, momentum: -1, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Greenland", code: "gl", score: 58, momentum: -3, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Grenada", code: "gd", score: 58, momentum: 4, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Guadeloupe", code: "gp", score: 58, momentum: -4, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Guam", code: "gu", score: 58, momentum: -3, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Guatemala", code: "gt", score: 58, momentum: -5, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Guernsey", code: "gg", score: 58, momentum: 2, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Guinea", code: "gn", score: 57, momentum: 9, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Guinea-Bissau", code: "gw", score: 57, momentum: 7, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Guyana", code: "gy", score: 57, momentum: -1, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Haiti", code: "ht", score: 57, momentum: 7, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Heard Island and McDonald Islands", code: "hm", score: 57, momentum: 2, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Honduras", code: "hn", score: 57, momentum: 6, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Hong Kong", code: "hk", score: 56, momentum: -2, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Hungary", code: "hu", score: 56, momentum: -1, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Iceland", code: "is", score: 56, momentum: 1, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Indonesia", code: "id", score: 56, momentum: 2, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Iran", code: "ir", score: 56, momentum: 0, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Iraq", code: "iq", score: 56, momentum: -2, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Ireland", code: "ie", score: 55, momentum: 8, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Isle of Man", code: "im", score: 55, momentum: 3, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Israel", code: "il", score: 55, momentum: 1, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Italy", code: "it", score: 55, momentum: -4, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Jamaica", code: "jm", score: 55, momentum: -2, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Jersey", code: "je", score: 54, momentum: 5, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Jordan", code: "jo", score: 54, momentum: 6, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Kazakhstan", code: "kz", score: 54, momentum: 2, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Kenya", code: "ke", score: 54, momentum: 0, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Kiribati", code: "ki", score: 54, momentum: -2, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Kuwait", code: "kw", score: 54, momentum: -4, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Kyrgyzstan", code: "kg", score: 53, momentum: 9, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Laos", code: "la", score: 53, momentum: -1, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Latvia", code: "lv", score: 53, momentum: 3, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Lebanon", code: "lb", score: 53, momentum: 4, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Lesotho", code: "ls", score: 53, momentum: -4, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Liberia", code: "lr", score: 53, momentum: 9, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Libya", code: "ly", score: 52, momentum: 1, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Liechtenstein", code: "li", score: 52, momentum: -1, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Lithuania", code: "lt", score: 52, momentum: 3, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Luxembourg", code: "lu", score: 52, momentum: 7, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Macao", code: "mo", score: 52, momentum: -3, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Madagascar", code: "mg", score: 52, momentum: 4, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Malawi", code: "mw", score: 51, momentum: 8, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Malaysia", code: "my", score: 51, momentum: 0, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Maldives", code: "mv", score: 51, momentum: 7, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Mali", code: "ml", score: 51, momentum: 8, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Malta", code: "mt", score: 51, momentum: 3, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Marshall Islands", code: "mh", score: 51, momentum: -2, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Martinique", code: "mq", score: 50, momentum: -4, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Mauritania", code: "mr", score: 50, momentum: 0, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Mauritius", code: "mu", score: 50, momentum: -5, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Mayotte", code: "yt", score: 50, momentum: 2, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Micronesia", code: "fm", score: 50, momentum: -1, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Moldova", code: "md", score: 50, momentum: 7, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Monaco", code: "mc", score: 49, momentum: 5, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Mongolia", code: "mn", score: 49, momentum: 9, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Montenegro", code: "me", score: 49, momentum: -2, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Montserrat", code: "ms", score: 49, momentum: -4, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Morocco", code: "ma", score: 49, momentum: 3, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Mozambique", code: "mz", score: 49, momentum: 4, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Myanmar", code: "mm", score: 48, momentum: -4, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Namibia", code: "na", score: 48, momentum: -2, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Nauru", code: "nr", score: 48, momentum: 5, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Nepal", code: "np", score: 48, momentum: 0, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "New Caledonia", code: "nc", score: 48, momentum: 7, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Nicaragua", code: "ni", score: 48, momentum: -4, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Niger", code: "ne", score: 47, momentum: 0, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Niue", code: "nu", score: 47, momentum: 4, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Norfolk Island", code: "nf", score: 47, momentum: 5, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "North Korea", code: "kp", score: 47, momentum: 0, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "North Macedonia", code: "mk", score: 47, momentum: 0, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Northern Mariana Islands", code: "mp", score: 47, momentum: 1, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Norway", code: "no", score: 46, momentum: 6, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Oman", code: "om", score: 46, momentum: 8, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Pakistan", code: "pk", score: 46, momentum: -5, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Palau", code: "pw", score: 46, momentum: 2, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Palestine", code: "ps", score: 46, momentum: 6, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Panama", code: "pa", score: 45, momentum: -2, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Papua New Guinea", code: "pg", score: 45, momentum: 2, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Paraguay", code: "py", score: 45, momentum: -3, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Peru", code: "pe", score: 45, momentum: -2, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Philippines", code: "ph", score: 45, momentum: 8, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Pitcairn", code: "pn", score: 45, momentum: -3, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Portugal", code: "pt", score: 44, momentum: 1, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Puerto Rico", code: "pr", score: 44, momentum: -4, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Qatar", code: "qa", score: 44, momentum: -2, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Republic of the Congo", code: "cg", score: 44, momentum: 9, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Romania", code: "ro", score: 44, momentum: 4, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Russia", code: "ru", score: 44, momentum: 8, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Rwanda", code: "rw", score: 43, momentum: 0, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Réunion", code: "re", score: 43, momentum: 7, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Saint Barthélemy", code: "bl", score: 43, momentum: 7, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Saint Helena", code: "sh", score: 43, momentum: -5, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Saint Kitts and Nevis", code: "kn", score: 43, momentum: 3, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Saint Lucia", code: "lc", score: 43, momentum: 8, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Saint Martin (French part)", code: "mf", score: 42, momentum: -5, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Saint Pierre and Miquelon", code: "pm", score: 42, momentum: 8, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Saint Vincent and the Grenadines", code: "vc", score: 42, momentum: 6, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Samoa", code: "ws", score: 42, momentum: 2, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "San Marino", code: "sm", score: 42, momentum: 2, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Sao Tome and Principe", code: "st", score: 42, momentum: 9, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Senegal", code: "sn", score: 41, momentum: 7, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Serbia", code: "rs", score: 41, momentum: 1, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Seychelles", code: "sc", score: 41, momentum: 6, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Sierra Leone", code: "sl", score: 41, momentum: 4, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Singapore", code: "sg", score: 41, momentum: 5, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Sint Maarten (Dutch part)", code: "sx", score: 41, momentum: -3, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Slovakia", code: "sk", score: 40, momentum: 4, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Slovenia", code: "si", score: 40, momentum: -1, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Solomon Islands", code: "sb", score: 40, momentum: 9, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Somalia", code: "so", score: 40, momentum: 4, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "South Georgia and the South Sandwich Islands", code: "gs", score: 40, momentum: 8, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "South Sudan", code: "ss", score: 40, momentum: 3, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Sri Lanka", code: "lk", score: 39, momentum: 6, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Sudan", code: "sd", score: 39, momentum: 5, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Suriname", code: "sr", score: 39, momentum: 3, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Svalbard and Jan Mayen", code: "sj", score: 39, momentum: -5, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Switzerland", code: "ch", score: 39, momentum: -2, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Syria", code: "sy", score: 39, momentum: -3, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Taiwan", code: "tw", score: 38, momentum: -1, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Tajikistan", code: "tj", score: 38, momentum: 6, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Tanzania", code: "tz", score: 38, momentum: -5, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Thailand", code: "th", score: 38, momentum: 2, movedBy: "MOBA voters", reasons: ["Macro sense", "Practice culture", "Mechanical growth"] },
  { name: "Timor-Leste", code: "tl", score: 38, momentum: 0, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Togo", code: "tg", score: 37, momentum: 1, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Tokelau", code: "tk", score: 37, momentum: -1, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Tonga", code: "to", score: 37, momentum: -3, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "Trinidad and Tobago", code: "tt", score: 37, momentum: -2, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Tunisia", code: "tn", score: 37, momentum: -4, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Turkmenistan", code: "tm", score: 37, momentum: 9, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Turks and Caicos Islands", code: "tc", score: 36, momentum: -5, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Tuvalu", code: "tv", score: 36, momentum: 8, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "U.S. Minor Outlying Islands", code: "um", score: 36, momentum: 4, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "U.S. Virgin Islands", code: "vi", score: 36, momentum: 0, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Uganda", code: "ug", score: 36, momentum: 3, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Ukraine", code: "ua", score: 36, momentum: 1, movedBy: "Infrastructure voters", reasons: ["Teams", "Events", "Coaching"] },
  { name: "United Arab Emirates", code: "ae", score: 35, momentum: 9, movedBy: "Momentum voters", reasons: ["Breakout players", "Fan energy", "Recent form"] },
  { name: "Uruguay", code: "uy", score: 35, momentum: 0, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Uzbekistan", code: "uz", score: 35, momentum: 4, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
  { name: "Vanuatu", code: "vu", score: 35, momentum: -3, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Vatican City", code: "va", score: 35, momentum: -2, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Venezuela", code: "ve", score: 35, momentum: -4, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Vietnam", code: "vn", score: 34, momentum: 9, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Wallis and Futuna", code: "wf", score: 34, momentum: 8, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Western Sahara", code: "eh", score: 34, momentum: 9, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Yemen", code: "ye", score: 34, momentum: 6, movedBy: "Community voters", reasons: ["Grassroots scene", "Online activity", "Rising talent"] },
  { name: "Zambia", code: "zm", score: 34, momentum: 8, movedBy: "Mobile voters", reasons: ["Mobile access", "Young audience", "Fast growth"] },
  { name: "Zimbabwe", code: "zw", score: 34, momentum: 9, movedBy: "Strategy voters", reasons: ["Patience", "Decision making", "Preparation"] },
  { name: "Åland Islands", code: "ax", score: 33, momentum: 3, movedBy: "FPS voters", reasons: ["Aim culture", "Local scene", "Team play"] },
];


function RankingsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(25,211,207,0.18),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(255,47,168,0.14),transparent_30%),linear-gradient(180deg,#F8FAFC_0%,#EEF7FA_100%)]" />
      <div className="absolute left-[-10%] top-40 h-[560px] w-[560px] rounded-full border border-[#19d3cf]/20" />
      <div className="absolute right-[-12%] top-72 h-[620px] w-[620px] rounded-full border border-[#ff2fa8]/20" />
      <div className="absolute inset-x-0 top-[250px] h-px bg-[#ff2fa8]/25" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(15,23,42,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.32)_1px,transparent_1px)] [background-size:96px_96px]" />
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = Math.max(max - min, 1);
      const y = 34 - ((value - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 38" className="h-9 w-28 overflow-visible" aria-hidden="true">
      <polyline fill="none" stroke="#19d3cf" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" points={points} />
    </svg>
  );
}

function pageThemeStyles() {
  return `
    html.skillatlas-dark .rankings-shell [class*="bg-white"] {
      background-color: rgba(53, 66, 80, 0.92) !important;
    }

    html.skillatlas-dark .rankings-shell [class*="bg-gray-50"] {
      background-color: rgba(32, 43, 55, 0.92) !important;
    }

    html.skillatlas-dark .rankings-shell [class*="text-gray-"] {
      color: rgb(203, 213, 225) !important;
    }

    html.skillatlas-dark .rankings-shell [class*="text-[#111827]"] {
      color: rgb(248, 250, 252) !important;
    }

    html.skillatlas-dark .rankings-shell input,
    html.skillatlas-dark .rankings-shell select {
      background-color: rgba(32, 43, 55, 0.96) !important;
      color: rgb(248, 250, 252) !important;
    }

    html.skillatlas-dark .rankings-shell {
      background: #2f3a46;
      color: rgb(248, 250, 252);
    }

    @keyframes skillatlas-rank-wheel-enter {
      0% {
        opacity: 0;
        transform: translate(-16px, 16px) scale(0.08);
      }

      70% {
        opacity: 1;
        transform: translate(0, 0) scale(1.04);
      }

      100% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
    }

    @keyframes skillatlas-rank-wheel-exit {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }

      100% {
        opacity: 0;
        transform: translate(-18px, 18px) scale(0.08);
      }
    }

    .skillatlas-rank-wheel {
      --wheel-number-default: #111827;
      --wheel-fade-bg:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.88), rgba(255,255,255,0.66) 34%, rgba(255,255,255,0.34) 58%, transparent 76%);
      --wheel-fade-shadow: 0 0 46px rgba(255,255,255,0.70);
      --wheel-glass-bg:
        radial-gradient(circle at 22% 86%, rgba(25,211,207,0.34), transparent 42%),
        radial-gradient(circle at 92% 14%, rgba(255,47,168,0.28), transparent 46%),
        linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.30));
      --wheel-glass-shadow: 0 12px 38px rgba(15,23,42,0.18), inset 0 0 25px rgba(25,211,207,0.14);
      transform-origin: left bottom;
      will-change: transform, opacity;
    }

    .skillatlas-rank-wheel-entering {
      animation: skillatlas-rank-wheel-enter 210ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .skillatlas-rank-wheel-exiting {
      animation: skillatlas-rank-wheel-exit 165ms cubic-bezier(0.7, 0, 0.84, 0) both;
    }

    html.skillatlas-dark .skillatlas-rank-wheel {
      --wheel-number-default: rgba(248,250,252,0.92);
      --wheel-fade-bg:
        radial-gradient(circle at 20% 80%, rgba(15,23,42,0.70), rgba(15,23,42,0.52) 34%, rgba(15,23,42,0.28) 58%, transparent 76%);
      --wheel-fade-shadow: 0 0 48px rgba(0,0,0,0.38);
      --wheel-glass-bg:
        radial-gradient(circle at 20% 88%, rgba(25,211,207,0.30), transparent 44%),
        radial-gradient(circle at 92% 12%, rgba(255,47,168,0.28), transparent 48%),
        linear-gradient(135deg, rgba(32,43,55,0.84), rgba(15,23,42,0.46));
      --wheel-glass-shadow: 0 12px 38px rgba(0,0,0,0.32), inset 0 0 28px rgba(25,211,207,0.12);
    }

    html.skillatlas-dark .rankings-shell > div:first-child {
      opacity: 0.58;
      filter: brightness(0.72) saturate(1.25);
    }
  `;
}



function visibleRankWindow(total: number, activeIndex: number) {
  const visibleCount = Math.min(11, total);
  const start = Math.max(0, Math.min(total - visibleCount, activeIndex - Math.floor(visibleCount / 2)));

  return Array.from({ length: visibleCount }, (_, index) => start + index + 1);
}

function RankWheel({
  total,
  draggedName,
  draggedIndex,
  targetIndex,
  setTargetIndex,
  onDropRank,
  phase,
}: {
  total: number;
  draggedName: string | null;
  draggedIndex: number | null;
  targetIndex: number | null;
  setTargetIndex: (index: number | null) => void;
  onDropRank: (index: number) => void;
  phase: "entering" | "exiting";
}) {
  if (!draggedName && phase !== "exiting") return null;

  const activeIndex = Math.max(0, Math.min(total - 1, targetIndex ?? draggedIndex ?? 0));
  const activeRank = activeIndex + 1;
  const ranks = visibleRankWindow(total, activeIndex);
  const activeWindowIndex = ranks.indexOf(activeRank);
  const radius = 132;

  function sizeForDistance(distance: number) {
    if (distance === 0) return 1;
    if (distance === 1) return 0.67;
    if (distance === 2) return 0.5;
    if (distance === 3) return 0.33;
    return 0.25;
  }

  function numberColour(distance: number) {
    if (distance === 0) return "#ff2fa8";
    if (distance === 1) return "rgba(255,47,168,0.72)";
    if (distance === 2) return "rgba(255,47,168,0.48)";
    if (distance === 3) return "rgba(255,47,168,0.30)";
    return "var(--wheel-number-default)";
  }

  function numberGlow(distance: number) {
    if (distance === 0) return "drop-shadow(0 0 9px rgba(255,47,168,0.62)) drop-shadow(0 5px 12px rgba(15,23,42,0.22))";
    if (distance <= 3) return "drop-shadow(0 0 8px rgba(255,47,168,0.22))";
    return "none";
  }

  return (
    <div
      className={`skillatlas-rank-wheel skillatlas-rank-wheel-${phase} fixed bottom-0 left-0 z-[95] h-[138px] w-[138px] overflow-visible`}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setTargetIndex(draggedIndex);
      }}
    >
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-[230px] w-[230px] rounded-tr-full backdrop-blur-[1.5px]"
        style={{
          background: "var(--wheel-fade-bg)",
          boxShadow: "var(--wheel-fade-shadow)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 h-[103px] w-[103px] rounded-tr-full border-r border-t border-[#ff2fa8]/35 backdrop-blur-xl"
        style={{
          background: "var(--wheel-glass-bg)",
          boxShadow: "var(--wheel-glass-shadow)",
        }}
      />
      <div className="absolute bottom-0 left-0 h-[77px] w-[77px] rounded-tr-full border-r border-t border-[#19d3cf]/28" />
      <div className="absolute bottom-0 left-0 h-[49px] w-[49px] rounded-tr-full border-r border-t border-[#ff2fa8]/18" />
      <div className="absolute bottom-[12px] left-[12px] h-[61px] w-[61px] rounded-tr-full bg-gradient-to-tr from-[#19d3cf]/10 to-[#ff2fa8]/10 blur-xl" />

      {ranks.map((rank, index) => {
        const angle = ranks.length === 1 ? 45 : 87 - (index / (ranks.length - 1)) * 82;
        const radians = (angle * Math.PI) / 180;
        const left = 0 + Math.cos(radians) * radius;
        const bottom = 0 + Math.sin(radians) * radius;
        const distanceFromActive = activeWindowIndex === -1 ? Math.abs(index - Math.floor(ranks.length / 2)) : Math.abs(index - activeWindowIndex);
        const active = rank === activeRank;
        const scale = sizeForDistance(distanceFromActive);
        const opacity = active ? 1 : Math.max(0.34, 0.86 - distanceFromActive * 0.085);

        return (
          <button
            key={rank}
            type="button"
            onDragOver={(event) => {
              event.preventDefault();
              setTargetIndex(rank - 1);
            }}
            onDragEnter={() => setTargetIndex(rank - 1)}
            onDrop={(event) => {
              event.preventDefault();
              onDropRank(rank - 1);
            }}
            className="absolute border-0 bg-transparent p-0 font-black leading-none tracking-[-0.08em] transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              left,
              bottom,
              color: numberColour(distanceFromActive),
              fontSize: active ? "1.43rem" : "0.97rem",
              opacity: active ? 1 : opacity,
              transform: `translate(-50%, 50%) scale(${scale})`,
              transformOrigin: "center",
              WebkitTextStroke: "0",
              textShadow: "none",
              filter: `${active ? "saturate(1.25) contrast(1.08)" : "none"} ${numberGlow(distanceFromActive)}`,
            }}
            aria-label={`Move ${draggedName} to rank ${rank}`}
          >
            {rank}
          </button>
        );
      })}
    </div>
  );
}

export default function LiveRankingsPage() {
  const [selectedGame, setSelectedGame] = useState("CS2");
  const [countries, setCountries] = useState(initialCountries);
  const [draggedName, setDraggedName] = useState<string | null>(null);
  const [wheelTargetIndex, setWheelTargetIndex] = useState<number | null>(null);
  const [hoveredRankIndex, setHoveredRankIndex] = useState<number | null>(null);
  const [wheelVisible, setWheelVisible] = useState(false);
  const [wheelPhase, setWheelPhase] = useState<"entering" | "exiting">("entering");
  const autoScrollVelocityRef = useRef(0);
  const autoScrollFrameRef = useRef<number | null>(null);
  const wheelExitTimerRef = useRef<number | null>(null);
  const [activity, setActivity] = useState([
    "Brazil surged after 42 FPS votes.",
    "Denmark defended #1 with tactical votes.",
    "Canada climbed after a Valorant wave.",
  ]);

  const leader = countries[0];
  const draggedIndex = draggedName
    ? countries.findIndex((country) => country.name === draggedName)
    : wheelTargetIndex;

  const liveScore = useMemo(() => countries.reduce((sum, country, index) => sum + country.score - index, 0), [countries]);

  useEffect(() => {
    if (!draggedName) {
      autoScrollVelocityRef.current = 0;

      if (autoScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }

      return;
    }

    const edgeZone = 150;
    const maxVelocity = 28;

    const updateVelocity = (event: globalThis.DragEvent) => {
      const y = event.clientY;
      const viewportHeight = window.innerHeight;

      const hoveredElement = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const hoveredRow = hoveredElement?.closest("[data-rank-index]") as HTMLElement | null;

      if (hoveredRow?.dataset.rankIndex) {
        const nextIndex = Number(hoveredRow.dataset.rankIndex);
        setWheelTargetIndex(nextIndex);
        setHoveredRankIndex(nextIndex);
      } else {
        const tableBody = document.querySelector<HTMLElement>("[data-live-rankings-body]");
        const firstRow = tableBody?.querySelector<HTMLElement>("[data-rank-index]");
        const bodyRect = tableBody?.getBoundingClientRect();
        const rowHeight = firstRow?.getBoundingClientRect().height ?? 52;

        if (bodyRect && rowHeight > 0 && event.clientY >= bodyRect.top && event.clientY <= bodyRect.bottom) {
          const approximateIndex = Math.max(0, Math.min(countries.length - 1, Math.floor((event.clientY - bodyRect.top) / rowHeight)));
          setWheelTargetIndex(approximateIndex);
          setHoveredRankIndex(approximateIndex);
        }
      }

      if (y < edgeZone) {
        const intensity = Math.min(1, (edgeZone - y) / edgeZone);
        autoScrollVelocityRef.current = -(5 + intensity * maxVelocity);
        return;
      }

      if (y > viewportHeight - edgeZone) {
        const intensity = Math.min(1, (y - (viewportHeight - edgeZone)) / edgeZone);
        autoScrollVelocityRef.current = 5 + intensity * maxVelocity;
        return;
      }

      autoScrollVelocityRef.current = 0;
    };

    const tick = () => {
      const velocity = autoScrollVelocityRef.current;

      if (velocity !== 0) {
        window.scrollBy({ top: velocity, left: 0, behavior: "auto" });
      }

      autoScrollFrameRef.current = window.requestAnimationFrame(tick);
    };

    window.addEventListener("dragover", updateVelocity);
    autoScrollFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("dragover", updateVelocity);
      autoScrollVelocityRef.current = 0;

      if (autoScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
    };
  }, [countries.length, draggedName]);

  useEffect(() => {
    return () => {
      if (wheelExitTimerRef.current !== null) {
        window.clearTimeout(wheelExitTimerRef.current);
      }
    };
  }, []);


  function openRankWheel(index: number) {
    if (wheelExitTimerRef.current !== null) {
      window.clearTimeout(wheelExitTimerRef.current);
      wheelExitTimerRef.current = null;
    }

    setWheelTargetIndex(index);
    setHoveredRankIndex(index);
    setWheelVisible(true);
    setWheelPhase("entering");
  }

  function closeRankWheel() {
    setWheelPhase("exiting");

    if (wheelExitTimerRef.current !== null) {
      window.clearTimeout(wheelExitTimerRef.current);
    }

    wheelExitTimerRef.current = window.setTimeout(() => {
      setWheelVisible(false);
      setDraggedName(null);
      setWheelTargetIndex(null);
      setHoveredRankIndex(null);
      wheelExitTimerRef.current = null;
    }, 170);
  }

  function averageRankedPosition(currentIndex: number, momentum: number, range: "7d" | "1m" | "1y") {
    const currentRank = currentIndex + 1;
    const multiplier = range === "7d" ? 0.35 : range === "1m" ? 0.7 : 1.15;
    const averageRank = currentRank + Math.round(momentum * multiplier);

    return Math.max(1, Math.min(countries.length, averageRank));
  }

  function moveCountry(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= countries.length) return;

    setCountries((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((country, index) => ({
        ...country,
        score: Math.max(1, country.score + (country.name === moved.name ? 1 : 0) - Math.max(0, index - fromIndex > 0 ? 0 : 0)),
      }));
    });

    const movedCountry = countries[fromIndex];
    const targetCountry = countries[toIndex];
    setActivity((items) => [
      `${movedCountry.name} moved ${toIndex < fromIndex ? "up" : "down"} near ${targetCountry.name} in live rankings.`,
      ...items,
    ].slice(0, 6));
  }

  function handleDrop(event: ReactDragEvent<HTMLTableRowElement>, targetIndex: number) {
    event.preventDefault();

    if (!draggedName) return;

    const fromIndex = countries.findIndex((country) => country.name === draggedName);
    moveCountry(fromIndex, targetIndex);
    closeRankWheel();
  }

  function dropCountryToRank(targetIndex: number) {
    if (!draggedName) return;

    const fromIndex = countries.findIndex((country) => country.name === draggedName);
    moveCountry(fromIndex, targetIndex);
    closeRankWheel();
  }

  return (
    <main className="rankings-shell relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827] transition-colors duration-300">
      <RankingsBackground />
      <style>{pageThemeStyles()}</style>
      {wheelVisible ? (
        <RankWheel
          total={countries.length}
          draggedName={draggedName}
          draggedIndex={draggedIndex}
          targetIndex={wheelTargetIndex}
          setTargetIndex={setWheelTargetIndex}
          onDropRank={dropCountryToRank}
          phase={wheelPhase}
        />
      ) : null}

      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-16 pt-[150px]">
        <div className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#19d3cf]">Live Rankings</p>
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="mb-2 text-xl font-black tracking-tight">Drag countries up and down the rankings in real time.</h1>
              <p className="max-w-4xl text-sm font-semibold leading-relaxed text-gray-600">
                A live ranking sandbox for community movement, instant momentum, and chaotic leaderboard theatre.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Live Game Lens</span>
              <select
                value={selectedGame}
                onChange={(event) => setSelectedGame(event.target.value)}
                className="h-14 w-full rounded-2xl border border-[#19d3cf]/35 bg-white/90 px-5 text-sm font-bold outline-none transition-all duration-300 focus:border-[#19d3cf] focus:shadow-[0_0_0_4px_rgba(25,211,207,0.14)]"
              >
                {["CS2", "League of Legends", "Valorant", "Fortnite", "Rocket League", "Chess"].map((game) => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <section className="mb-6 overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-4 border-b border-[#ff2fa8]/20 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Live Board</p>
            <div className="flex items-center gap-3">
              <p className="text-xs font-black text-[#ff2fa8]">{selectedGame}</p>
              <span className="rounded-full bg-[#19d3cf]/12 px-3 py-1 text-xs font-black text-[#19d3cf]">Live heat {liveScore.toLocaleString()}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] uppercase tracking-[0.16em] text-gray-500">
                  <th className="px-4 py-3 font-black">Rank</th>
                  <th className="px-4 py-3 font-black">Country</th>
                  <th className="px-4 py-3 font-black">Live Score</th>
                  <th className="px-4 py-3 font-black">Momentum</th>
                  <th className="px-4 py-3 font-black">7 Day Avg Rank</th>
                  <th className="px-4 py-3 font-black">1 Month Avg Rank</th>
                  <th className="px-4 py-3 font-black">1 Year Avg Rank</th>
                  <th className="px-4 py-3 font-black">Move</th>
                </tr>
              </thead>

              <tbody data-live-rankings-body>
                {countries.map((country, index) => (
                  <tr
                    key={country.name}
                    data-rank-index={index}
                    draggable
                    onDragStart={() => {
                      setDraggedName(country.name);
                      openRankWheel(index);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setWheelTargetIndex(index);
                      setHoveredRankIndex(index);
                    }}
                    onDragEnter={() => {
                      setWheelTargetIndex(index);
                      setHoveredRankIndex(index);
                    }}
                    onDrop={(event) => handleDrop(event, index)}
                    onDragEnd={closeRankWheel}
                    className={`h-[52px] cursor-grab border-b border-gray-200/80 transition-all duration-300 ease-out active:cursor-grabbing ${
                      draggedName && hoveredRankIndex === index ? "bg-[#19d3cf]/15" : "hover:bg-[#19d3cf]/5"
                    }`}
                  >
                    <td className={`whitespace-nowrap px-4 py-2 text-base font-black text-[#ff2fa8] ${draggedName === country.name && hoveredRankIndex !== index ? "opacity-45" : ""}`}>#{index + 1}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="flex items-center gap-3">
                        <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-50 shadow-inner">
                          <img src={`https://flagcdn.com/w80/${country.code}.png`} alt={`${country.name} flag`} className="h-full w-full object-cover" />
                        </span>
                        <span className="text-sm font-black">{country.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <span className="rounded-full bg-[#19d3cf]/12 px-2.5 py-0.5 text-xs font-black text-[#19d3cf]">{country.score}</span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-2 text-xs font-black ${country.momentum >= 0 ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>
                      {country.momentum >= 0 ? `▲ ${country.momentum}` : `▼ ${Math.abs(country.momentum)}`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs font-black text-gray-700">
                      #{averageRankedPosition(index, country.momentum, "7d")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs font-black text-gray-700">
                      #{averageRankedPosition(index, country.momentum, "1m")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs font-black text-gray-700">
                      #{averageRankedPosition(index, country.momentum, "1y")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => moveCountry(index, index - 1)} className="rounded-full border border-[#19d3cf]/35 px-2.5 py-0.5 text-xs font-black text-[#19d3cf]">↑</button>
                        <button type="button" onClick={() => moveCountry(index, index + 1)} className="rounded-full border border-[#ff2fa8]/35 px-2.5 py-0.5 text-xs font-black text-[#ff2fa8]">↓</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-5 shadow-sm backdrop-blur">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Live Movement Feed</p>
          <div className="grid gap-3 md:grid-cols-3">
            {activity.map((item) => (
              <div key={item} className="rounded-2xl border border-gray-200 bg-white/70 p-4 text-sm font-black text-gray-700">
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
