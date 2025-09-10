export async function getAgeHelper(dateStr: string): Promise<number> {
  const today = new Date();
  const birthDate = new Date(dateStr);
  let age: number;
  let yearDifference = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0) {
    age = yearDifference - 1;
    return age;
  }

  age = yearDifference;
  return age;
}
