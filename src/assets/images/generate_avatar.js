export const getAvatarSVG = (name = "Admin") => {
    const char = name.charAt(0).toUpperCase();
    const colors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];
    const bgColor = colors[char.charCodeAt(0) % colors.length];

    return `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="16" fill="${bgColor}"/>
        <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="14" font-family="Inter, sans-serif" font-weight="600" dy=".3em">${char}</text>
    </svg>`;
};
