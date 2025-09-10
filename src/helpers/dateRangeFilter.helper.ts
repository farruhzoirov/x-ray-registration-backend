export const createDateRangeFilter = (fromDate?: string, toDate?: string) => {
  const filter: Record<string, Date> = {};

  if (fromDate) {
    const [year, month, day] = fromDate.split('-');

    if (day && month && year) {
      const startDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        0,
        0,
        0,
        0,
      );
      filter.$gte = startDate;
    }
  }

  if (toDate) {
    const [year, month, day] = toDate.split('-');

    if (day && month && year) {
      const endDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        23,
        59,
        59,
        999,
      );
      filter.$lte = endDate;
    }
  }

  return Object.keys(filter).length > 0 ? filter : null;
};
