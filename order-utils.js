(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DelisseOrder=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const clean=value=>String(value??'').trim();
  function formatAddress(details){
    return ['building','area','landmark','city','state','pin'].map(key=>clean(details[key])).filter(Boolean).join(', ')+', India';
  }
  function formatItemLine(item){
    const parts=[];
    if(clean(item.dietary))parts.push(clean(item.dietary));
    if(clean(item.coffee))parts.push(clean(item.coffee));
    if(clean(item.sweetness))parts.push(clean(item.sweetness));
    if(clean(item.topping))parts.push(clean(item.topping));
    const custom=parts.length?` [${parts.join(' · ')}]`:'';
    const note=clean(item.customNote)?` — Note: "${clean(item.customNote)}"`:'';
    return `${item.quantity} × ${item.product.name} (${item.product.size})${custom}${note}`;
  }
  function buildMessage(items,details){
    const lines=items.map(formatItemLine);
    return [
      "Hello Délisse! I'd like to enquire about an order.",
      clean(details.orderType)?`Order type: ${clean(details.orderType)}`:'',
      `Name: ${clean(details.name)}`,
      `Phone: ${clean(details.phone)}`,
      clean(details.region)?`Delivery zone: ${clean(details.region)}`:'',
      `Delivery address: ${formatAddress(details)}`,
      `Address type: ${clean(details.addressType)||'Home'}`,
      clean(details.notes)?`Preferred date / notes: ${clean(details.notes)}`:'',
      '',
      ...lines,
      'Please share the exact prices and confirm availability and location-based delivery charges.'
    ].filter(Boolean).join('\n');
  }
  return {formatAddress,formatItemLine,buildMessage};
});
