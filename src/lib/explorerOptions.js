export const versionLabels = {v0: "Full Dynamics Simulation", v1_5: "Next Message Prediction"};
export const partitionOptions = [{value: "test", label: "Test groups"}, {value: "train", label: "Training groups"}, {value: "all", label: "All groups"}];
export const splitOptions = [{value: "group", label: "Group generalization"}, {value: "topic", label: "Topic generalization"}];
export const demographicLabels = {age: "Age", gender: "Gender", ethnicity: "Ethnicity", education: "Education", income: "Household income", occupation: "Occupation", politicalIdentity: "Political affiliation", politicalViews: "Political views", bibleBelief: "Views of the Bible", evangelical: "Evangelical identity", religion: "Religion", maritalStatus: "Marital status", childrenSchool: "Children", residence: "Area of residence", origin: "Country of origin", residency: "Country of residence"};
export function displayAnswer(value) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) return "Not reported";
  return Array.isArray(value) ? value.map(displayAnswer).join(", ") : String(value).replaceAll("-", " ");
}
