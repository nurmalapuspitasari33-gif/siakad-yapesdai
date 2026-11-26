export default function formatDashboardUserName(user) {
    const rawName = typeof user?.name === 'string' ? user.name : '';
    const rolePrefix = typeof user?.role === 'string' && user.role
        ? `${user.role}_`
        : '';
    const nameWithoutRolePrefix = rolePrefix
        && rawName.toLowerCase().startsWith(rolePrefix.toLowerCase())
        ? rawName.slice(rolePrefix.length)
        : rawName;
    const name = nameWithoutRolePrefix.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

    return name || 'Pengguna';
}
