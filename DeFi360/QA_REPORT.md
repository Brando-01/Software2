Errores encontrados (REVISAR QA):

C:\Proyectos\Software2\DeFi360\frontend\src\components\WalletConnector.jsx

  11:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders



Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:

* Update external systems with the latest state from React.

* Subscribe for updates from some external system, calling setState in a callback function when external state changes.



Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).



   9 |     const savedBalance = localStorage.getItem('walletBalance');

  10 |     if (savedAddress) {

> 11 |       setWalletAddress(savedAddress);

     |       ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect

  12 |       setBalance(savedBalance);

  13 |     }

  14 |   }, []);  react-hooks/set-state-in-effect

  29:9  error  'disconnectWallet' is assigned a value but never used











                                            no-unused-vars



C:\Proyectos\Software2\DeFi360\frontend\src\pages\Dashboard.jsx

  16:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders



Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:

* Update external systems with the latest state from React.

* Subscribe for updates from some external system, calling setState in a callback function when external state changes.



Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).



  14 |     const balance = parseFloat(localStorage.getItem('walletBalance')) || 0;

  15 |

> 16 |     setWalletData({

     |     ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect

  17 |       address,

  18 |       balance,

  19 |       totalLent: 2450.00,  react-hooks/set-state-in-effect



✖ 3 problems (3 errors, 0 warnings)