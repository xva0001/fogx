export const convertFormData = async (formData: FormData) => {
    const obj: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        obj[key] = {
          name: value.name,
          type: value.type,
          size: value.size,
          base64: await fileToBase64(value),
        };
      } else {
        obj[key] = value;
      }
    }
    return obj;
  };