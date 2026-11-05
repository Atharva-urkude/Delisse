(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DelisseOrder=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const clean=value=>String(value??'').trim();
  function formatAddress(details){
    return ['building','area','landmark','city','state','pin'].map(key=>clean(details[key])).filter(Boolean).join(', ')+', India';
  }
  function buildMessage(items,details){
    const subtotal=items.reduce((sum,item)=>sum+item.product.price*item.quantity,0);
    const lines=items.map(item=>`${item.quantity} × ${item.product.name} (${item.product.size}) — ₹${item.product.price*item.quantity}`);
    return ["Hello Délisse! I'd like to place an order enquiry.",`Name: ${clean(details.name)}`,`Phone: ${clean(details.phone)}`,`Delivery address: ${formatAddress(details)}`,`Address type: ${clean(details.addressType)||'Home'}`,clean(details.notes)?`Preferred date / notes: ${clean(details.notes)}`:'','',...lines,`Subtotal: ₹${subtotal}`,'Please confirm availability, delivery, and final charges.'].filter(Boolean).join('\n');
  }
  return {formatAddress,buildMessage};
});
