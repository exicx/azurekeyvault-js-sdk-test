#!/bin/bash

if [ "$LK_RANCHER_SERVICE_DISCOVERY" ]; then
  sleep 1

  function get_service {
    curl -sS --header "accept: application/json" http://rancher-metadata.rancher.internal/latest/$1
  }

  stack=$( get_service "self/stack" )
  host=$( get_service "self/host" )

  export RANCHER_ENVIRONMENT=$( echo $stack | jq -r '.environment_name' )
  export RANCHER_VNET=$( echo $host | jq -r '.labels.vnet' )
  export RANCHER_INST=$( echo $host | jq -r '.labels.inst' )
  export RANCHER_GROUP=$( echo $host | jq -r '.labels.group' )  

  ## Do other environment stuff
  if [ -z "$LK_CLIENTID" ]; then
    export LK_CLIENTID=dev
  fi

  if [ -z "$LK_CLIENTSEC" ]; then
    export LK_CLIENTSEC=dev
  fi

  if [ -z "$LK_VURI" ]; then
    export LK_VURI="https://lk-${RANCHER_VNET}${RANCHER_INST}-keyvault.vault.azure.net"
  fi

  if [ -z "$LK_GVURI" ]; then
    export LK_GVURI="https://lk-${RANCHER_VNET}global-keyvault.vault.azure.net"
  fi

  if [ -z "$LK_HOST_PORT" ]; then
    export LK_HOST_PORT=9500
  fi
fi

exec "$@"
