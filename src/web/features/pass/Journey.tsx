import { JOURNEY_STEPS } from '../../../shared/requestSteps';
import type { RequestStatus } from '../../../shared/status';

/** Where this request is, as four steps with the current one marked. */
export function Journey({ status }: { status: RequestStatus }) {
  const current = JOURNEY_STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="journey">
      {JOURNEY_STEPS.map((step, index) => (
        <li
          key={step.status}
          className={`journey__step ${index <= current ? 'journey__step--reached' : ''}`}
          aria-current={index === current ? 'step' : undefined}
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}
