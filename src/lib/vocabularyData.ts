import { VocabularyTopic } from '@/types';

export const vocabularyTopics: VocabularyTopic[] = [
  {
    id: 'ap-physics-forces',
    name: 'AP Physics - Forces',
    terms: [
      { term: 'net force', definition: 'The vector sum of all forces acting on an object' },
      { term: 'acceleration', definition: 'The rate of change of velocity over time' },
      { term: "Newton's Second Law", definition: 'F = ma, force equals mass times acceleration' },
      { term: 'friction', definition: 'A force that opposes the relative motion of surfaces in contact' },
      { term: 'normal force', definition: 'The perpendicular force exerted by a surface on an object' },
      { term: 'tension', definition: 'The pulling force transmitted through a string, rope, or cable' },
      { term: 'gravitational force', definition: 'The attractive force between objects with mass' },
      { term: 'free body diagram', definition: 'A diagram showing all forces acting on an object' },
      { term: 'equilibrium', definition: 'A state where the net force on an object is zero' },
      { term: 'inertia', definition: 'The tendency of an object to resist changes in its motion' },
    ],
  },
  {
    id: 'ap-chemistry-reactions',
    name: 'AP Chemistry - Reactions',
    terms: [
      { term: 'reactant', definition: 'A substance that undergoes change in a chemical reaction' },
      { term: 'product', definition: 'A substance formed as a result of a chemical reaction' },
      { term: 'catalyst', definition: 'A substance that speeds up a reaction without being consumed' },
      { term: 'activation energy', definition: 'The minimum energy required to start a chemical reaction' },
      { term: 'exothermic', definition: 'A reaction that releases heat to the surroundings' },
      { term: 'endothermic', definition: 'A reaction that absorbs heat from the surroundings' },
      { term: 'equilibrium constant', definition: 'The ratio of product concentrations to reactant concentrations at equilibrium' },
      { term: 'rate law', definition: 'An equation relating reaction rate to reactant concentrations' },
      { term: 'oxidation', definition: 'The loss of electrons in a chemical reaction' },
      { term: 'reduction', definition: 'The gain of electrons in a chemical reaction' },
    ],
  },
  {
    id: 'ap-biology-cells',
    name: 'AP Biology - Cell Biology',
    terms: [
      { term: 'mitochondria', definition: 'The powerhouse of the cell, produces ATP through cellular respiration' },
      { term: 'ribosome', definition: 'Cellular structure responsible for protein synthesis' },
      { term: 'endoplasmic reticulum', definition: 'Network of membranes involved in protein and lipid synthesis' },
      { term: 'Golgi apparatus', definition: 'Organelle that modifies, packages, and ships proteins' },
      { term: 'cell membrane', definition: 'Phospholipid bilayer that controls what enters and exits the cell' },
      { term: 'nucleus', definition: 'Contains genetic material and controls cell activities' },
      { term: 'ATP', definition: 'Adenosine triphosphate, the energy currency of cells' },
      { term: 'photosynthesis', definition: 'Process by which plants convert light energy to chemical energy' },
      { term: 'cellular respiration', definition: 'Process of breaking down glucose to produce ATP' },
      { term: 'osmosis', definition: 'Movement of water across a semipermeable membrane' },
    ],
  },
  {
    id: 'calculus-derivatives',
    name: 'Calculus - Derivatives',
    terms: [
      { term: 'derivative', definition: 'The instantaneous rate of change of a function' },
      { term: 'limit', definition: 'The value a function approaches as input approaches a value' },
      { term: 'chain rule', definition: 'Method for finding derivative of composite functions' },
      { term: 'product rule', definition: 'Method for finding derivative of product of functions' },
      { term: 'quotient rule', definition: 'Method for finding derivative of quotient of functions' },
      { term: 'implicit differentiation', definition: 'Finding derivatives when y is not explicitly defined' },
      { term: 'critical point', definition: 'Point where derivative equals zero or is undefined' },
      { term: 'inflection point', definition: 'Point where concavity of function changes' },
      { term: 'tangent line', definition: 'Line that touches curve at exactly one point' },
      { term: 'second derivative', definition: 'The derivative of the derivative, measures concavity' },
    ],
  },
  {
    id: 'us-history-civil-war',
    name: 'US History - Civil War',
    terms: [
      { term: 'secession', definition: 'The act of withdrawing from the Union' },
      { term: 'Confederacy', definition: 'The Southern states that seceded from the Union' },
      { term: 'Emancipation Proclamation', definition: 'Lincoln\'s order freeing slaves in Confederate states' },
      { term: 'abolition', definition: 'The movement to end slavery' },
      { term: 'Reconstruction', definition: 'Period of rebuilding the South after the Civil War' },
      { term: 'states\' rights', definition: 'The belief that states should have more power than federal government' },
      { term: 'Union', definition: 'The Northern states during the Civil War' },
      { term: 'Gettysburg', definition: 'Turning point battle of the Civil War' },
      { term: 'Antietam', definition: 'Bloodiest single-day battle in American history' },
      { term: 'Appomattox', definition: 'Location where Lee surrendered to Grant' },
    ],
  },
  {
    id: 'marketing-101',
    name: 'Marketing 101',
    terms: [
      { term: 'marketing', definition: 'Creating value for customers by meeting their needs and wants' },
      { term: 'Four Ps', definition: 'Product, Price, Promotion, and Place - key marketing elements' },
      { term: 'target market', definition: 'Specific group of consumers a business aims to reach' },
      { term: 'market segmentation', definition: 'Dividing a market into distinct groups of buyers' },
      { term: 'brand awareness', definition: 'The extent to which consumers recognize a brand' },
      { term: 'value proposition', definition: 'The unique value a product offers to customers' },
      { term: 'customer acquisition', definition: 'The process of gaining new customers' },
      { term: 'conversion rate', definition: 'Percentage of visitors who take a desired action' },
      { term: 'ROI', definition: 'Return on Investment - measure of profitability' },
      { term: 'advertising', definition: 'Paid promotion of products or services through media' },
    ],
  },
];

export function getTopicById(id: string): VocabularyTopic | undefined {
  return vocabularyTopics.find(topic => topic.id === id);
}

export function searchTermsInText(text: string, topic: VocabularyTopic): string[] {
  const foundTerms: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const { term } of topic.terms) {
    if (lowerText.includes(term.toLowerCase())) {
      foundTerms.push(term);
    }
  }
  
  return foundTerms;
}
