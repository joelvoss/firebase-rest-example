import { generateDisplayName } from '../generate-displayname';

describe(`generateDisplayName`, () => {
  it(`generates a random name`, () => {
    const animals = ['Sloth', 'Slug'];
    expect(generateDisplayName(animals)).toMatch(/anonymous (sloth|slug)/i);
  });
});
