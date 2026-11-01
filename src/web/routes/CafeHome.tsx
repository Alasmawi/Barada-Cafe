import { AppHeader } from '../components/Layout';
import { MessageState } from '../components/MessageState';

/** Stand-in so a café user has somewhere to land until Phase 4. */
export function CafeHome() {
  return (
    <>
      <AppHeader />
      <main className="page">
        <MessageState
          art="empty"
          title="The café side opens next."
          body="Switch to a creator from the menu above to try Finjan today."
        />
      </main>
    </>
  );
}
