/* @ds-bundle: {"format":4,"namespace":"PersonalDashboardDesignSystem_1d5722","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"DateStamp","sourcePath":"components/core/DateStamp.jsx"},{"name":"EmptyState","sourcePath":"components/core/EmptyState.jsx"},{"name":"IndexCard","sourcePath":"components/core/IndexCard.jsx"},{"name":"Orb","sourcePath":"components/core/Orb.jsx"},{"name":"PageHeader","sourcePath":"components/core/PageHeader.jsx"},{"name":"PaperCard","sourcePath":"components/core/PaperCard.jsx"},{"name":"UnreadDot","sourcePath":"components/core/UnreadDot.jsx"},{"name":"ArrowButton","sourcePath":"components/navigation/ArrowButton.jsx"},{"name":"NavBar","sourcePath":"components/navigation/NavBar.jsx"},{"name":"Calendar","sourcePath":"ui_kits/personal-dashboard/Calendar.jsx"},{"name":"Inbox","sourcePath":"ui_kits/personal-dashboard/Inbox.jsx"}],"sourceHashes":{"components/core/Button.jsx":"0cfaf169f706","components/core/DateStamp.jsx":"1ff9c2508ef7","components/core/EmptyState.jsx":"d59867484322","components/core/IndexCard.jsx":"6bed55a69b40","components/core/Orb.jsx":"644984418f25","components/core/PageHeader.jsx":"6fb22a38f9c9","components/core/PaperCard.jsx":"2df8f42dc5be","components/core/UnreadDot.jsx":"82548ed2437f","components/navigation/ArrowButton.jsx":"1ec91074e376","components/navigation/NavBar.jsx":"d4a004da57f7","ui_kits/personal-dashboard/Calendar.jsx":"063a9d01e149","ui_kits/personal-dashboard/Checkin.jsx":"c907b2e0733d","ui_kits/personal-dashboard/DashboardNavBar.jsx":"7dc4fb53e466","ui_kits/personal-dashboard/Home.jsx":"04f22dda643c","ui_kits/personal-dashboard/Inbox.jsx":"5a5712c7a134"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PersonalDashboardDesignSystem_1d5722 = window.PersonalDashboardDesignSystem_1d5722 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Button({
  variant = 'primary',
  children,
  style,
  ...rest
}) {
  if (variant === 'secondary') {
    return /*#__PURE__*/React.createElement("button", _extends({}, rest, {
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        cursor: 'pointer',
        padding: 0,
        ...style
      },
      onMouseEnter: e => e.currentTarget.style.textDecoration = 'underline',
      onMouseLeave: e => e.currentTarget.style.textDecoration = 'none'
    }), children);
  }
  return /*#__PURE__*/React.createElement("button", _extends({}, rest, {
    style: {
      background: 'var(--headline-fill)',
      border: '2px solid var(--ink)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 22px',
      fontFamily: 'var(--font-ui)',
      fontWeight: 600,
      fontSize: 15,
      color: 'var(--text-primary)',
      cursor: 'pointer',
      boxShadow: '0 0 0 var(--ink)',
      transition: 'box-shadow .15s, transform .15s',
      transform: 'translate(0,0)',
      ...style
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = '2px 2px 0 var(--ink)';
      e.currentTarget.style.transform = 'translate(-2px,-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = '0 0 0 var(--ink)';
      e.currentTarget.style.transform = 'translate(0,0)';
    }
  }), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/DateStamp.jsx
try { (() => {
function DateStamp({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-date)',
      fontWeight: 500,
      color: 'var(--text-muted)',
      textAlign: 'center'
    }
  }, children);
}
Object.assign(__ds_scope, { DateStamp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/DateStamp.jsx", error: String((e && e.message) || e) }); }

// components/core/EmptyState.jsx
try { (() => {
function EmptyState({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-accent)',
      fontWeight: 700,
      color: 'var(--ink)',
      fontSize: 20,
      textAlign: 'center',
      padding: '32px 0'
    }
  }, children);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/core/IndexCard.jsx
try { (() => {
function IndexCard({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      fontFamily: 'var(--font-ui)',
      color: 'var(--text-primary)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { IndexCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IndexCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Orb.jsx
try { (() => {
function Orb({
  size = 220,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 32%, var(--orb-highlight), var(--orb-core) 70%)',
      boxShadow: '0 0 60px 10px var(--orb-highlight)',
      ...style
    }
  });
}
Object.assign(__ds_scope, { Orb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Orb.jsx", error: String((e && e.message) || e) }); }

// components/core/PageHeader.jsx
try { (() => {
function PageHeader({
  children
}) {
  return /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-page-header)',
      margin: 0,
      color: 'var(--headline-fill)',
      textShadow: '2px 2px 0 var(--ink)'
    }
  }, children);
}
Object.assign(__ds_scope, { PageHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PageHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/PaperCard.jsx
try { (() => {
function PaperCard({
  children,
  placeholder,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320,
      background: 'var(--paper)',
      borderRadius: '4px 4px 30px 30px / 4px 4px 40px 40px',
      boxShadow: 'var(--shadow-soft)',
      padding: '32px 24px',
      position: 'relative',
      clipPath: 'polygon(0% 0%,100% 0%,100% 92%,95% 100%,88% 90%,80% 100%,70% 92%,60% 100%,50% 90%,40% 100%,30% 92%,20% 100%,12% 90%,0% 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -14,
      left: '50%',
      transform: 'translateX(-50%) rotate(-4deg)',
      width: 90,
      height: 28,
      background: 'var(--tape)',
      opacity: 0.75
    }
  }), children ?? /*#__PURE__*/React.createElement("textarea", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    style: {
      width: '100%',
      height: 100,
      border: 'none',
      background: 'transparent',
      resize: 'none',
      outline: 'none',
      fontFamily: 'var(--font-ui)',
      color: 'var(--text-primary)',
      fontSize: 15
    }
  }));
}
Object.assign(__ds_scope, { PaperCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PaperCard.jsx", error: String((e && e.message) || e) }); }

// components/core/UnreadDot.jsx
try { (() => {
function UnreadDot({
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--arrow-pink)',
      ...style
    }
  });
}
Object.assign(__ds_scope, { UnreadDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/UnreadDot.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ArrowButton.jsx
try { (() => {
function ArrowButton({
  direction = 'right',
  children,
  onClick
}) {
  const clip = direction === 'right' ? 'polygon(0% 0%,70% 0%,100% 50%,70% 100%,0% 100%)' : 'polygon(30% 0%,100% 0%,100% 100%,30% 100%,0% 50%)';
  const pad = direction === 'right' ? '16px 40px 16px 28px' : '16px 28px 16px 40px';
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      background: 'var(--arrow-pink)',
      color: 'var(--text-primary)',
      border: 'none',
      fontFamily: 'var(--font-ui)',
      fontWeight: 500,
      fontSize: 14,
      cursor: 'pointer',
      clipPath: clip,
      padding: pad,
      transition: 'transform 150ms ease-out'
    },
    onMouseEnter: e => e.currentTarget.style.transform = `translateX(${direction === 'right' ? 4 : -4}px) scale(1.03)`,
    onMouseLeave: e => e.currentTarget.style.transform = 'translateX(0) scale(1)'
  }, children);
}
Object.assign(__ds_scope, { ArrowButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ArrowButton.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavBar.jsx
try { (() => {
function NavBar({
  page = 'home'
}) {
  const links = ['home', 'checkin', 'inbox', 'calendar'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--nav-height)',
      background: 'var(--nav-bg)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--orb-core)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-nav)'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      color: l === page ? 'var(--nav-active)' : 'var(--nav-inactive)',
      fontWeight: l === page ? 600 : 500
    }
  }, l))));
}
Object.assign(__ds_scope, { NavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/personal-dashboard/Calendar.jsx
try { (() => {
const events = [{
  day: 'mon 10',
  title: 'team sync',
  time: '10:00am',
  today: true
}, {
  day: 'tue 11',
  title: 'dentist',
  time: '2:30pm',
  today: false
}, {
  day: 'wed 12',
  title: 'design review',
  time: '4:00pm',
  today: false
}];
function Calendar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-page-header)',
      color: 'var(--headline-fill)',
      textShadow: '2px 2px 0 var(--ink)',
      margin: 0,
      transform: 'rotate(-2deg)'
    }
  }, "calendar"), events.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: 'var(--paper)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      fontFamily: 'var(--font-ui)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: 13,
      width: 56
    }
  }, e.day), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-primary)',
      fontWeight: 600,
      fontSize: 15
    }
  }, e.title), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: 13
    }
  }, e.time)), e.today && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--arrow-pink)'
    }
  }))));
}
Object.assign(__ds_scope, { Calendar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/personal-dashboard/Calendar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/personal-dashboard/Checkin.jsx
try { (() => {
function Checkin() {
  const [text, setText] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      padding: '64px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-page-header)',
      color: 'var(--headline-fill)',
      textShadow: '2px 2px 0 var(--ink)',
      margin: 0,
      transform: 'rotate(-2deg)'
    }
  }, "checkin"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320,
      background: 'var(--paper)',
      borderRadius: '4px 4px 30px 30px / 4px 4px 40px 40px',
      boxShadow: 'var(--shadow-soft)',
      padding: '32px 24px',
      position: 'relative',
      clipPath: 'polygon(0% 0%,100% 0%,100% 92%,95% 100%,88% 90%,80% 100%,70% 92%,60% 100%,50% 90%,40% 100%,30% 92%,20% 100%,12% 90%,0% 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -14,
      left: '50%',
      transform: 'translateX(-50%) rotate(-4deg)',
      width: 90,
      height: 28,
      background: 'var(--tape)',
      opacity: 0.75
    }
  }), /*#__PURE__*/React.createElement("textarea", {
    value: text,
    onChange: e => setText(e.target.value),
    placeholder: "how was today?",
    style: {
      width: '100%',
      height: 100,
      border: 'none',
      background: 'transparent',
      resize: 'none',
      outline: 'none',
      fontFamily: 'var(--font-ui)',
      color: 'var(--text-primary)',
      fontSize: 15
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSaved(true),
    style: {
      background: 'var(--headline-fill)',
      border: '2px solid var(--ink)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 22px',
      fontFamily: 'var(--font-ui)',
      fontWeight: 600,
      color: 'var(--text-primary)',
      cursor: 'pointer'
    }
  }, "save checkin"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setText(''),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-ui)',
      cursor: 'pointer'
    }
  }, "skip for now")), saved && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-accent)',
      fontWeight: 700,
      color: 'var(--ink)',
      fontSize: 18
    }
  }, "got it, saved!"));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/personal-dashboard/Checkin.jsx", error: String((e && e.message) || e) }); }

// ui_kits/personal-dashboard/DashboardNavBar.jsx
try { (() => {
function DashboardNavBar({
  page,
  mode,
  goto
}) {
  const links = ['home', 'checkin', 'inbox', 'calendar'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--nav-height)',
      background: 'var(--nav-bg)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--orb-core)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-nav)'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("span", {
    key: l,
    onClick: () => goto(l),
    style: {
      cursor: 'pointer',
      color: l === page ? 'var(--nav-active)' : 'var(--nav-inactive)',
      fontWeight: l === page ? 600 : 500
    }
  }, l, l === 'home' ? ` (${mode})` : ''))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/personal-dashboard/DashboardNavBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/personal-dashboard/Home.jsx
try { (() => {
function Home({
  mode,
  setMode,
  goto
}) {
  const isDay = mode === 'day';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      width: '100%',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 220,
      height: 220,
      borderRadius: '50%',
      margin: '12px 0 24px',
      background: 'radial-gradient(circle at 35% 32%, var(--orb-highlight), var(--orb-core) 70%)',
      boxShadow: '0 0 60px 10px var(--orb-highlight)'
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-hero)',
      color: 'var(--headline-fill)',
      textShadow: '3px 3px 0 var(--ink)',
      transform: 'rotate(-3deg)',
      margin: 0
    }
  }, isDay ? 'good morning!' : 'good night!'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-accent)',
      fontWeight: 700,
      color: 'var(--ink)',
      fontSize: 18,
      marginTop: -8
    }
  }, isDay ? 'write your checkin!' : 'jot ur thoughts'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => goto('inbox'),
    style: arrowStyle('left')
  }, "inbox"), /*#__PURE__*/React.createElement("button", {
    onClick: () => goto('calendar'),
    style: arrowStyle('right')
  }, "calendar")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-ui)',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-date)',
      marginTop: 'var(--space-section)'
    }
  }, "monday august 10 2026"), /*#__PURE__*/React.createElement("button", {
    onClick: () => goto('checkin'),
    style: {
      marginTop: 8,
      background: 'none',
      border: 'none',
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-ui)',
      fontSize: 15,
      cursor: 'pointer',
      textDecoration: 'underline'
    }
  }, "go to checkin \u2192")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMode(isDay ? 'night' : 'day'),
    style: {
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: '#fff',
      border: '1px solid rgba(0,0,0,.15)',
      borderRadius: 20,
      padding: '8px 16px',
      fontFamily: 'var(--font-ui)',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "switch to ", isDay ? 'night' : 'day'));
}
function arrowStyle(dir) {
  return {
    background: 'var(--arrow-pink)',
    color: 'var(--text-primary)',
    border: 'none',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    clipPath: dir === 'right' ? 'polygon(0% 0%,70% 0%,100% 50%,70% 100%,0% 100%)' : 'polygon(30% 0%,100% 0%,100% 100%,30% 100%,0% 50%)',
    padding: dir === 'right' ? '16px 40px 16px 28px' : '16px 28px 16px 40px',
    transition: 'transform 150ms ease-out'
  };
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/personal-dashboard/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/personal-dashboard/Inbox.jsx
try { (() => {
const messages = [{
  from: 'sana',
  preview: 'sending the notes over now',
  unread: true
}, {
  from: 'weekly digest',
  preview: 'your week in review is ready',
  unread: true
}, {
  from: 'the team',
  preview: 'thanks for jumping on the call',
  unread: false
}];
function Inbox() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-page-header)',
      color: 'var(--headline-fill)',
      textShadow: '2px 2px 0 var(--ink)',
      margin: 0,
      transform: 'rotate(-2deg)'
    }
  }, "inbox"), messages.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-accent)',
      fontWeight: 700,
      color: 'var(--ink)',
      fontSize: 20,
      textAlign: 'center',
      padding: '32px 0'
    }
  }, "nothing here yet") : messages.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: 'var(--paper)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      fontFamily: 'var(--font-ui)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-primary)',
      fontWeight: 600,
      fontSize: 15
    }
  }, m.from), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: 14
    }
  }, m.preview)), m.unread && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--arrow-pink)',
      flexShrink: 0
    }
  }))));
}
Object.assign(__ds_scope, { Inbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/personal-dashboard/Inbox.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.DateStamp = __ds_scope.DateStamp;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.IndexCard = __ds_scope.IndexCard;

__ds_ns.Orb = __ds_scope.Orb;

__ds_ns.PageHeader = __ds_scope.PageHeader;

__ds_ns.PaperCard = __ds_scope.PaperCard;

__ds_ns.UnreadDot = __ds_scope.UnreadDot;

__ds_ns.ArrowButton = __ds_scope.ArrowButton;

__ds_ns.NavBar = __ds_scope.NavBar;

__ds_ns.Calendar = __ds_scope.Calendar;

__ds_ns.Inbox = __ds_scope.Inbox;

})();
