import PropTypes from 'prop-types';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
